package br.livia.parafusinhos

import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.ApplicationInfo
import android.graphics.Rect
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedDispatcher
import java.io.ByteArrayInputStream
import java.io.IOException
import kotlin.math.ceil

/**
 * Tela única do aplicativo: um WebView em tela cheia rodando o jogo web (pasta jogo/),
 * servido direto dos assets do APK num endereço https local — nada passa pela rede.
 */
class MainActivity : Activity() {

    /** Fica nulo depois de destruído (fim da tela ou queda do processo de renderização). */
    private var webView: WebView? = null

    /**
     * Comando JS com as margens seguras mais recentes (já executado na página). Fica guardado
     * para não repetir a cada despacho de insets e para reaplicar quando a página recarrega.
     */
    private var areaSegura: String? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Inspeção pelo chrome://inspect só no APK de depuração.
        if ((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        val corDeFundo = getColor(R.color.fundo_jogo)
        val vista = WebView(this).apply {
            setBackgroundColor(corDeFundo)
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            // Segurar o dedo não abre menu de seleção: no jogo, segurar não quer dizer nada.
            setOnLongClickListener { true }
            isLongClickable = false
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true // o localStorage guarda o progresso
                mediaPlaybackRequiresUserGesture = false // sons do WebAudio
                allowFileAccess = false
                allowContentAccess = false
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                textZoom = 100 // o jogo já se ajusta à tela; a fonte do sistema o deformaria
            }
            webViewClient = ClienteDoJogo()
            addJavascriptInterface(PonteAndroid(), "ParafusinhosAndroid")
        }
        webView = vista
        setContentView(vista)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        // De ponta a ponta também no Android 11 a 14, igual ao que o 15+ já impõe a quem mira a
        // API 35+ (sem volta no 16, por isso a chamada ficou obsoleta): o jogo ocupa a tela toda
        // e se afasta sozinho das barras e do recorte pelas margens seguras.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
            Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM
        ) {
            @Suppress("DEPRECATION")
            window.setDecorFitsSystemWindows(false)
        }
        telaCheia()

        // Recorte e barras podem mudar (dobráveis, multijanela): recalcula a cada despacho. Usa o
        // que a decorView repassa ao conteúdo, já sem as barras para as quais ela mesma reservou
        // espaço (as que o sistema não deixa esconder), para a página não se afastar duas vezes.
        window.decorView.setOnApplyWindowInsetsListener { decor, insets ->
            decor.onApplyWindowInsets(insets).also { atualizarAreaSegura(it) }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT,
            ) { voltar() }
        }

        vista.loadUrl(ENDERECO_INICIAL)
    }

    override fun onResume() {
        super.onResume()
        webView?.let { vista ->
            vista.resumeTimers()
            vista.onResume()
            vista.evaluateJavascript(JS_RETOMAR, null)
        }
    }

    override fun onPause() {
        webView?.let { vista ->
            // Primeiro o jogo salva e silencia o som; depois o WebView para.
            vista.evaluateJavascript(JS_PAUSAR, null)
            vista.onPause()
            vista.pauseTimers()
        }
        super.onPause()
    }

    override fun onDestroy() {
        descartarWebView()
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // Diálogos do sistema e a troca de app podem trazer as barras de volta.
        if (hasFocus) telaCheia()
    }

    // Só até o Android 12L o voltar chega aqui. Do 13 em diante (enableOnBackInvokedCallback e, no
    // 16, o voltar preditivo) nem onBackPressed nem KEYCODE_BACK chegam: todo voltar passa pelo
    // callback registrado no onCreate. Por isso o lint, que sugere migrar para o AndroidX, não se
    // aplica aqui.
    @SuppressLint("GestureBackNavigation")
    @Suppress("OVERRIDE_DEPRECATION")
    override fun onBackPressed() = voltar()

    /** Voltar: o jogo fecha o painel de cima e devolve true; sem painel aberto, o app fecha. */
    private fun voltar() {
        val vista = webView
        if (vista == null) {
            finish()
            return
        }
        vista.evaluateJavascript(JS_VOLTAR) { resultado ->
            if (resultado != "true") finish()
        }
    }

    /** Esconde as barras do sistema; um deslize a partir da borda as mostra por um instante. */
    private fun telaCheia() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                hide(WindowInsets.Type.systemBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            // Android 8 a 10 só têm as flags antigas para o modo imersivo.
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_FULLSCREEN
        }
    }

    /**
     * Passa as margens seguras para o CSS do jogo (--seguro-*), em px de CSS (= dp),
     * arredondando para cima para nada ficar embaixo do recorte ou de uma barra.
     */
    private fun atualizarAreaSegura(insets: WindowInsets) {
        val margens = margensSeguras(insets)
        val densidade = resources.displayMetrics.density
        val comando = listOf(
            "topo" to margens.top,
            "base" to margens.bottom,
            "esq" to margens.left,
            "dir" to margens.right,
        ).joinToString(";") { (lado, px) ->
            "document.documentElement.style.setProperty('--seguro-$lado','${ceil(px / densidade).toInt()}px')"
        }
        if (comando == areaSegura) return
        areaSegura = comando
        webView?.evaluateJavascript(comando, null)
    }

    /**
     * Margens a evitar, em px físicos. Android 11+: recorte da câmera mais as barras do sistema
     * visíveis. Escondidas, ou mostradas por um instante com o deslize, elas valem zero; só contam
     * quando o sistema não deixa escondê-las (multijanela, janelas no modo desktop).
     * Android 9 e 10: só o recorte, pois com as flags antigas (LAYOUT_STABLE) as barras aparecem
     * como se estivessem sempre visíveis. Antes do Android 9 não há API de recorte (zero).
     */
    private fun margensSeguras(insets: WindowInsets): Rect = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
            insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
                .let { Rect(it.left, it.top, it.right, it.bottom) }

        Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ->
            insets.displayCutout
                ?.let { Rect(it.safeInsetLeft, it.safeInsetTop, it.safeInsetRight, it.safeInsetBottom) }
                ?: Rect()

        else -> Rect()
    }

    /** Tira o WebView da tela e libera os recursos; depois disso ele não pode mais ser usado. */
    private fun descartarWebView() {
        val vista = webView ?: return
        webView = null
        (vista.parent as? ViewGroup)?.removeView(vista)
        vista.destroy()
    }

    /** Serve o jogo a partir dos assets e não deixa o WebView sair do endereço local. */
    private inner class ClienteDoJogo : WebViewClient() {

        override fun shouldInterceptRequest(
            view: WebView,
            request: WebResourceRequest,
        ): WebResourceResponse =
            if (request.url.host == HOST) respostaDoAsset(request.url) else respostaVazia(403, "Forbidden")

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
            request.url.host != HOST

        override fun onPageFinished(view: WebView, url: String?) {
            // Documento novo: as variáveis CSS precisam ser aplicadas de novo.
            areaSegura?.let { view.evaluateJavascript(it, null) }
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            // Sem o processo de renderização o WebView não serve mais: descarta e recria a tela;
            // o jogo se restaura sozinho a partir do progresso salvo.
            descartarWebView()
            if (!isFinishing) recreate()
            return true
        }

        /** Lê o arquivo pedido de dentro do APK (a raiz do site é a pasta jogo/); 404 se faltar. */
        private fun respostaDoAsset(endereco: Uri): WebResourceResponse {
            val caminho = endereco.path.orEmpty().removePrefix("/").ifEmpty { "index.html" }
            val extensao = caminho.substringAfterLast('.', "").lowercase()
            return try {
                WebResourceResponse(
                    TIPOS_MIME[extensao] ?: "application/octet-stream",
                    if (extensao in EXTENSOES_TEXTO) "UTF-8" else null,
                    assets.open(caminho),
                )
            } catch (e: IOException) {
                respostaVazia(404, "Not Found")
            }
        }

        /** Resposta sem corpo com o código HTTP dado. */
        private fun respostaVazia(codigo: Int, motivo: String) = WebResourceResponse(
            "text/plain",
            "UTF-8",
            codigo,
            motivo,
            emptyMap(),
            ByteArrayInputStream(ByteArray(0)),
        )
    }

    /** Objeto que o JavaScript enxerga como window.ParafusinhosAndroid (chamado fora da thread de UI). */
    private inner class PonteAndroid {

        /** Vibração curta pelo retorno tátil do sistema, que dispensa a permissão VIBRATE. */
        @JavascriptInterface
        fun vibrar(tipo: String?) {
            val efeito = when (tipo) {
                "leve" -> HapticFeedbackConstants.KEYBOARD_TAP
                "medio" -> HapticFeedbackConstants.VIRTUAL_KEY
                "forte" -> HapticFeedbackConstants.LONG_PRESS
                "erro" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    HapticFeedbackConstants.REJECT
                } else {
                    HapticFeedbackConstants.LONG_PRESS
                }

                else -> return
            }
            runOnUiThread { webView?.performHapticFeedback(efeito) }
        }

        @JavascriptInterface
        fun versao(): String = BuildConfig.VERSION_NAME
    }

    private companion object {
        /** Domínio reservado do Android para conteúdo local: os pedidos nunca chegam à rede. */
        const val HOST = "appassets.androidplatform.net"
        const val ENDERECO_INICIAL = "https://$HOST/index.html"

        const val JS_VOLTAR =
            "(window.Parafusinhos && window.Parafusinhos.voltar) ? window.Parafusinhos.voltar() : false"
        const val JS_PAUSAR =
            "window.Parafusinhos && window.Parafusinhos.pausar && window.Parafusinhos.pausar()"
        const val JS_RETOMAR =
            "window.Parafusinhos && window.Parafusinhos.retomar && window.Parafusinhos.retomar()"

        /** Tipo MIME por extensão de arquivo. */
        val TIPOS_MIME = mapOf(
            "html" to "text/html",
            "js" to "text/javascript",
            "css" to "text/css",
            "svg" to "image/svg+xml",
            "woff2" to "font/woff2",
            "woff" to "font/woff",
            "ttf" to "font/ttf",
            "png" to "image/png",
            "jpg" to "image/jpeg",
            "json" to "application/json",
            "txt" to "text/plain",
            "webmanifest" to "application/manifest+json",
        )

        /** Extensões de texto, entregues em UTF-8. */
        val EXTENSOES_TEXTO = setOf("html", "js", "css", "svg", "json", "txt", "webmanifest")
    }
}
