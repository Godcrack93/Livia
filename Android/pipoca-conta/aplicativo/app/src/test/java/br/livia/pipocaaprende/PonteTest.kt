package br.livia.pipocaaprende

import br.livia.pipocaaprende.RegrasAssinatura.Conhecido
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Protocolo da ponte (PROJETO.md, seção 10; referência: jogo/teste/ponte-falsa.js), sem aparelho:
 * fila até o 'pronto', pacote 'estado' primeiro, mensagens de estado fora da fila, página nova.
 */
class PonteTest {

    private val recebidas = mutableListOf<JSONObject>()       // JS → Android, depois de passar pela ponte
    private var prontos = 0
    private var estadoAgora = Ponte.estado(
        voz = Ponte.dadosVoz(false, "iniciando"),
        assinatura = assinatura(base.copy(carregando = true)),
        insets = Ponte.dadosInsets(0, 0, 0, 0),
    )
    private val ponte = Ponte({ recebidas.add(it) }, { estadoAgora }, { prontos++ })

    /** O que chegaria em PipocaAndroid.onmessage (cada página tem o seu canal). */
    private val paraOJogo = mutableListOf<JSONObject>()
    private val canal: (String) -> Unit = { paraOJogo.add(JSONObject(it)) }

    private fun doJogo(json: String, c: (String) -> Unit = canal) = ponte.receberTexto(json, c)
    private fun tipos() = paraOJogo.map { it.getString("tipo") }

    @Test
    fun nadaVaiParaOJogoAntesDoPronto() {
        ponte.enviar(Ponte.vozFim("f1", "fim"))
        doJogo("""{"tipo":"falar","texto":"Oi!","id":"f2","velocidade":0.9,"volume":1}""")
        ponte.enviar(Ponte.vozFim("f2", "interrompida"))
        assertTrue(paraOJogo.isEmpty())
        assertFalse(ponte.pronto)
        assertEquals("o pedido de fala chega ao Android mesmo antes do pronto", listOf("falar"), recebidas.map { it.getString("tipo") })
        assertEquals("f2", recebidas[0].getString("id"))
    }

    @Test
    fun prontoMandaOEstadoEDepoisAFila() {
        ponte.enviar(Ponte.vozFim("f1", "fim"))
        ponte.enviar(Ponte.codigoRevisao(false))
        estadoAgora = Ponte.estado(Ponte.dadosVoz(true, ""), assinatura(base), Ponte.dadosInsets(32, 0, 0, 0))
        doJogo("""{"tipo":"pronto","versao":"1.0.0"}""")
        assertTrue(ponte.pronto)
        assertEquals(1, prontos)
        assertEquals(listOf("estado", "voz-fim", "codigoRevisao"), tipos())
        val estado = paraOJogo[0]
        assertEquals(true, estado.getJSONObject("voz").get("disponivel"))
        assertEquals("", estado.getJSONObject("voz").get("motivo"))
        assertEquals(32, estado.getJSONObject("insets").get("esq"))
        assertEquals("R$ 14,90", estado.getJSONObject("assinatura").get("precoFormatado"))
        assertEquals("o 'pronto' também chega ao Android", "pronto", recebidas.last().getString("tipo"))
    }

    @Test
    fun mensagensDeEstadoNaoEsperamNaFila() {
        // antes do pronto: o pacote 'estado' já leva o valor mais novo de voz, assinatura e insets
        ponte.enviar(Ponte.voz(true, ""))
        ponte.enviar(Ponte.assinatura(assinatura(base)))
        ponte.enviar(Ponte.insets(10, 0, 0, 0))
        ponte.enviar(Ponte.msg("pausa"))
        ponte.enviar(Ponte.msg("retomar"))
        ponte.enviar(Ponte.msg("voltar"))
        doJogo("""{"tipo":"pronto"}""")
        assertEquals(listOf("estado", "voltar"), tipos())
    }

    @Test
    fun depoisDoProntoTudoVaiNaHora() {
        doJogo("""{"tipo":"pronto"}""")
        paraOJogo.clear()
        ponte.enviar(Ponte.voz(false, "sem-ptbr"))
        ponte.enviar(Ponte.insets(0, 0, 24, 0))
        ponte.enviar(Ponte.msg("pausa"))
        assertEquals(listOf("voz", "insets", "pausa"), tipos())
        assertEquals("sem-ptbr", paraOJogo[0].getString("motivo"))
        assertEquals(24, paraOJogo[1].getInt("dir"))
    }

    @Test
    fun paginaNovaEsperaOutroPronto() {
        val antigas = mutableListOf<String>()
        doJogo("""{"tipo":"pronto"}""") { antigas.add(it) }
        ponte.reiniciar()                                   // a WebView carregou a página de novo (ou foi recriada)
        assertFalse(ponte.pronto)
        ponte.enviar(Ponte.vozFim("f9", "fim"))
        doJogo("""{"tipo":"pronto"}""")
        assertEquals("a página antiga recebeu só o estado dela", 1, antigas.size)
        assertEquals(listOf("estado", "voz-fim"), tipos())
        assertEquals(2, prontos)
    }

    @Test
    fun filaTemLimite() {
        repeat(Ponte.FILA_MAXIMA + 10) { i -> ponte.enviar(Ponte.vozFim("f$i", "fim")) }
        doJogo("""{"tipo":"pronto"}""")
        assertEquals(1 + Ponte.FILA_MAXIMA, paraOJogo.size)
        assertEquals("ficam as mais novas", "f10", paraOJogo[1].getString("id"))
    }

    @Test
    fun textoQueNaoEJsonEIgnorado() {
        doJogo("isto não é json")
        doJogo("")
        assertTrue(recebidas.isEmpty())
        assertFalse(ponte.pronto)
    }

    @Test
    fun soAOrigemDoAppConversa() {
        assertTrue(Ponte.origemDoApp("https", "appassets.androidplatform.net"))
        assertTrue(Ponte.origemDoApp("https", "APPASSETS.androidplatform.net"))
        assertFalse(Ponte.origemDoApp("http", "appassets.androidplatform.net"))
        assertFalse(Ponte.origemDoApp("https", "appassets.androidplatform.net.exemplo.com"))
        assertFalse(Ponte.origemDoApp("https", "play.google.com"))
        assertFalse(Ponte.origemDoApp(null, null))
    }

    /** As mensagens Android → JS têm as mesmas chaves que a ponte falsa manda (e que o jogo lê). */
    @Test
    fun formatoDasMensagens() {
        fun chaves(o: JSONObject) = o.keys().asSequence().toSet()
        assertEquals(setOf("tipo", "voz", "assinatura", "insets", "depuracao"),
            chaves(Ponte.estado(Ponte.dadosVoz(true, ""), assinatura(base), Ponte.dadosInsets(0, 0, 0, 0))))
        assertEquals(setOf("tipo", "disponivel", "motivo"), chaves(Ponte.voz(true, "")))
        assertEquals(setOf("tipo", "id", "motivo"), chaves(Ponte.vozFim("f1", "fim")))
        assertEquals(setOf("tipo", "estado"), chaves(Ponte.assinatura(assinatura(base))))
        assertEquals(setOf("tipo", "ok"), chaves(Ponte.codigoRevisao(true)))
        assertEquals(setOf("tipo", "esq", "topo", "dir", "base"), chaves(Ponte.insets(1, 2, 3, 4)))
        assertEquals(setOf("tipo"), chaves(Ponte.msg("voltar")))
    }

    /**
     * Grava em app/build/ponte/mensagens.json as mensagens exatamente como o app as monta, para o teste do
     * navegador (ferramentas/testar.mjs) entregá-las ao jogo de verdade.
     */
    @Test
    fun gravaAsMensagensParaOTesteDoNavegador() {
        val estados = linkedMapOf(
            "inativa" to base.copy(playAtiva = false),
            "semteste" to base.copy(playAtiva = false, temTeste = false, diasTeste = 0),
            "carregando" to base.copy(carregando = true, precoFormatado = "", temTeste = false, diasTeste = 0),
            "pendente" to base.copy(playAtiva = false, pendente = true),
            "indisponivel" to base.copy(indisponivel = true, erro = "play-indisponivel", precoFormatado = "", temTeste = false, diasTeste = 0),
            "semPreco" to base.copy(playAtiva = false, precoFormatado = "", temTeste = false, diasTeste = 0, erro = "sem-conexao"),
            "cancelada" to base.copy(playAtiva = false, erro = "compra-cancelada"),
            "ativa" to base.copy(playAtiva = true),
            "cache" to base.copy(cacheAtiva = true, confirmadoEm = AGORA - 2 * DIA, erro = "sem-conexao"),
            "revisao" to base.copy(playAtiva = false, revisaoDesde = AGORA, revisaoAte = AGORA + RegrasAssinatura.DURACAO_REVISAO_MS),
        )
        val tudo = JSONObject()
            .put("estado", Ponte.estado(Ponte.dadosVoz(true, ""), assinatura(base.copy(playAtiva = false)), Ponte.dadosInsets(0, 0, 0, 0)))
            .put("estadoRecorte", Ponte.estado(Ponte.dadosVoz(true, ""), assinatura(base.copy(playAtiva = false)), Ponte.dadosInsets(36, 0, 0, 0)))
            .put("vozOk", Ponte.voz(true, ""))
            .put("vozIniciando", Ponte.voz(false, "iniciando"))
            .put("vozSemPtbr", Ponte.voz(false, "sem-ptbr"))
            .put("vozSemMotor", Ponte.voz(false, "sem-motor"))
            .put("insetsRecorte", Ponte.insets(36, 0, 0, 0))
            .put("insetsBarras", Ponte.insets(0, 24, 0, 48))
            .put("insetsZero", Ponte.insets(0, 0, 0, 0))
            .put("codigoOk", Ponte.codigoRevisao(true))
            .put("codigoErrado", Ponte.codigoRevisao(false))
            .put("voltar", Ponte.msg("voltar"))
            .put("pausa", Ponte.msg("pausa"))
            .put("retomar", Ponte.msg("retomar"))
        val assinaturas = JSONObject()
        estados.forEach { (nome, c) -> assinaturas.put(nome, Ponte.assinatura(assinatura(c))) }
        tudo.put("assinaturas", assinaturas)
        val arquivo = File("build/ponte/mensagens.json")
        arquivo.parentFile?.mkdirs()
        arquivo.writeText(tudo.toString(2), Charsets.UTF_8)
        assertTrue(arquivo.length() > 0)
        assertTrue(assinaturas.getJSONObject("cache").getJSONObject("estado").getBoolean("ativa"))
        assertEquals("revisao", assinaturas.getJSONObject("revisao").getJSONObject("estado").getString("origem"))
    }

    private companion object {
        const val DIA = 24 * 60 * 60 * 1000L
        const val AGORA = 1_800_000_000_000L
        val base = Conhecido(
            playAtiva = null, cacheAtiva = false, confirmadoEm = 0L, revisaoDesde = 0L, revisaoAte = 0L,
            carregando = false, precoFormatado = "R$ 14,90", temTeste = true, diasTeste = 7,
            pendente = false, indisponivel = false, erro = "",
        )
        fun assinatura(c: Conhecido): JSONObject = RegrasAssinatura.estado(c, AGORA).json()
    }
}
