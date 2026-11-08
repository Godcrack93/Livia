package br.livia.pipocaconta

import android.net.Uri
import android.util.Log
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONException
import org.json.JSONObject

/**
 * Ponte com o jogo (PROJETO.md, seção 10). O comportamento de referência é o de jogo/teste/ponte-falsa.js.
 *
 * JS → Android: o jogo chama PipocaAndroid.postMessage(JSON.stringify({tipo, ...})); o objeto PipocaAndroid é
 * injetado por WebViewCompat.addWebMessageListener só na origem do app. As mensagens chegam em [ouvinte]
 * (thread principal) e seguem para [aoReceber].
 *
 * Android → JS: [enviar] responde pelo JavaScriptReplyProxy (chega em PipocaAndroid.onmessage). Até o jogo mandar
 * {tipo:'pronto'}, tudo fica numa fila. No 'pronto', a ponte manda primeiro o pacote {tipo:'estado', voz,
 * assinatura, insets} com os valores ATUAIS e depois o resto da fila. Por isso 'voz', 'assinatura' e 'insets'
 * não entram na fila (o pacote já leva o valor mais novo). 'pausa' e 'retomar' também não: quem cuida delas é
 * a MainActivity, que manda 'pausa' logo depois do pacote se o app estiver em segundo plano.
 *
 * A lógica (fila, pacote inicial, ordem) fica em [receberTexto] e [enviar], sem nada do Android, para os testes
 * do PC (PonteTest) conferirem o protocolo. Use só na thread principal.
 */
class Ponte(
    /** Cada mensagem do jogo (JS → Android), na thread principal. */
    private val aoReceber: (JSONObject) -> Unit,
    /** O pacote {tipo:'estado', voz, assinatura, insets} com os valores de agora (monte com [estado]). */
    private val estadoAtual: () -> JSONObject,
    /** Chamado logo depois de o pacote e a fila irem para o jogo. */
    private val aoFicarPronto: () -> Unit,
) {
    companion object {
        private const val TAG = "PipocaPonte"
        const val NOME_OBJETO = "PipocaAndroid"
        /** Mensagens que o pacote 'estado' (ou a MainActivity) já cobre: não esperam na fila. */
        val SO_ESTADO = setOf("voz", "assinatura", "insets", "pausa", "retomar")
        const val FILA_MAXIMA = 60

        /** Mensagem {tipo} pronta para completar com put(...). */
        fun msg(tipo: String): JSONObject = JSONObject().put("tipo", tipo)

        // ---- mensagens Android → JS (PROJETO.md, seção 10), todas montadas aqui, iguais às da ponte falsa
        /** {disponivel, motivo: '' | 'iniciando' | 'sem-ptbr' | 'sem-motor'} (vai solta ou dentro do 'estado'). */
        fun dadosVoz(disponivel: Boolean, motivo: String): JSONObject =
            JSONObject().put("disponivel", disponivel).put("motivo", motivo)
        fun voz(disponivel: Boolean, motivo: String): JSONObject = dadosVoz(disponivel, motivo).put("tipo", "voz")
        /** motivo: 'fim' | 'interrompida' | 'erro'. */
        fun vozFim(id: String, motivo: String): JSONObject = msg("voz-fim").put("id", id).put("motivo", motivo)
        fun assinatura(estado: JSONObject): JSONObject = msg("assinatura").put("estado", estado)
        fun codigoRevisao(ok: Boolean): JSONObject = msg("codigoRevisao").put("ok", ok)
        /** Barras + recorte, em dp (= px CSS). */
        fun dadosInsets(esq: Int, topo: Int, dir: Int, base: Int): JSONObject =
            JSONObject().put("esq", esq).put("topo", topo).put("dir", dir).put("base", base)
        fun insets(esq: Int, topo: Int, dir: Int, base: Int): JSONObject = dadosInsets(esq, topo, dir, base).put("tipo", "insets")
        /** Pacote inicial, resposta ao 'pronto'. */
        fun estado(voz: JSONObject, assinatura: JSONObject, insets: JSONObject, depuracao: Boolean = false): JSONObject =
            msg("estado").put("voz", voz).put("assinatura", assinatura).put("insets", insets).put("depuracao", depuracao)

        /** Só a página do próprio app (https://appassets.androidplatform.net) conversa com o Android. */
        fun origemDoApp(esquema: String?, host: String?): Boolean =
            esquema == "https" && ArquivosDoJogo.HOST.equals(host, ignoreCase = true)
    }

    /** Por onde a resposta volta ao jogo (o JavaScriptReplyProxy da página atual). */
    private var canal: ((String) -> Unit)? = null
    private val fila = ArrayDeque<JSONObject>()

    /** O jogo já disse 'pronto' nesta página? */
    var pronto = false
        private set

    /** Ouvinte registrado na WebView (WebViewCompat.addWebMessageListener). */
    val ouvinte = WebViewCompat.WebMessageListener { _, mensagem: WebMessageCompat, origem: Uri,
                                                    quadroPrincipal: Boolean, proxy: JavaScriptReplyProxy ->
        // só o quadro principal da origem do app; a lista de origens do addWebMessageListener já filtra, isto é a 2ª trava
        if (!quadroPrincipal || !origemDoApp(origem.scheme, origem.host)) return@WebMessageListener
        if (mensagem.type != WebMessageCompat.TYPE_STRING) return@WebMessageListener
        val texto = mensagem.data ?: return@WebMessageListener
        receberTexto(texto) { saida -> responder(proxy, saida) }
    }

    /** Uma mensagem do jogo (texto JSON) e o canal de resposta da página que mandou. */
    fun receberTexto(texto: String, canalDaPagina: (String) -> Unit) {
        val obj = try {
            JSONObject(texto)
        } catch (e: JSONException) {
            if (BuildConfig.DEBUG) Log.w(TAG, "mensagem que não é JSON: $texto")
            return
        }
        canal = canalDaPagina
        if (obj.optString("tipo") == "pronto") {
            pronto = true
            mandar(estadoAtual())
            while (fila.isNotEmpty()) mandar(fila.removeFirst())
            aoFicarPronto()
        }
        try {
            aoReceber(obj)
        } catch (e: Exception) {
            Log.e(TAG, "erro ao tratar ${obj.optString("tipo")}", e)
        }
    }

    /** Manda uma mensagem ao jogo (ou guarda até o 'pronto'). */
    fun enviar(mensagem: JSONObject) {
        if (pronto && canal != null) {
            mandar(mensagem)
            return
        }
        if (mensagem.optString("tipo") in SO_ESTADO) return
        fila.addLast(mensagem)
        while (fila.size > FILA_MAXIMA) fila.removeFirst()
    }

    /** Página nova (ou WebView nova): esquece o canal antigo e espera outro 'pronto'. */
    fun reiniciar() {
        pronto = false
        canal = null
        fila.clear()
    }

    private fun mandar(mensagem: JSONObject) {
        val c = canal ?: return
        c(mensagem.toString())
    }

    private fun responder(proxy: JavaScriptReplyProxy, texto: String) {
        try {
            // o proxy só existe porque o recurso WEB_MESSAGE_LISTENER existe (a MainActivity conferiu antes de registrar)
            if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) proxy.postMessage(texto)
        } catch (e: Exception) {
            Log.w(TAG, "não consegui mandar uma mensagem ao jogo", e)
        }
    }
}
