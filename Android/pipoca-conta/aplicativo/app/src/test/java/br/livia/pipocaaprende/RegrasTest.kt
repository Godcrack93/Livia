package br.livia.pipocaaprende

import br.livia.pipocaaprende.RegrasAssinatura.Conhecido
import br.livia.pipocaaprende.RegrasAssinatura.Fase
import br.livia.pipocaaprende.RegrasAssinatura.Oferta
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Testes das regras que não dependem do aparelho (rodam no PC: gradlew.bat testDebugUnitTest). */
class RegrasTest {

    // ------------------------------------------------------------ arquivos do jogo
    @Test
    fun caminhosDoJogo() {
        assertEquals("index.html", ArquivosDoJogo.caminhoRelativo("/"))
        assertEquals("index.html", ArquivosDoJogo.caminhoRelativo(""))
        assertEquals("index.html", ArquivosDoJogo.caminhoRelativo(null))
        assertEquals("index.html", ArquivosDoJogo.caminhoRelativo("/index.html"))
        assertEquals("js/app.js", ArquivosDoJogo.caminhoRelativo("/js/app.js"))
        assertEquals("js/telas/mapa.js", ArquivosDoJogo.caminhoRelativo("//js//telas/mapa.js"))
        assertEquals("fontes/LICENCA-Fredoka.txt", ArquivosDoJogo.caminhoRelativo("/fontes/LICENCA-Fredoka.txt"))
        // nada sai da pasta do jogo
        assertNull(ArquivosDoJogo.caminhoRelativo("/../segredo.xml"))
        assertNull(ArquivosDoJogo.caminhoRelativo("/js/../../AndroidManifest.xml"))
        assertNull(ArquivosDoJogo.caminhoRelativo("/./index.html"))
        assertNull(ArquivosDoJogo.caminhoRelativo("/js\\..\\x"))
    }

    @Test
    fun tiposDosArquivos() {
        assertEquals("text/html", ArquivosDoJogo.tipo("index.html"))
        assertEquals("text/javascript", ArquivosDoJogo.tipo("js/app.js"))
        assertEquals("text/css", ArquivosDoJogo.tipo("estilo.css"))
        assertEquals("font/woff2", ArquivosDoJogo.tipo("fontes/fredoka-500.woff2"))
        assertEquals("text/plain", ArquivosDoJogo.tipo("fontes/LICENCA-Fredoka.txt"))
        assertEquals("application/octet-stream", ArquivosDoJogo.tipo("sem-extensao"))
        assertEquals("utf-8", ArquivosDoJogo.codificacao("js/app.js"))
        assertNull(ArquivosDoJogo.codificacao("fontes/fredoka-700.woff2"))
    }

    /** Tudo o que o index.html carrega existe em ../jogo e nada vem de teste/ (que não vai para o APK). */
    @Test
    fun indexCarregaSoArquivosQueVaoParaOApk() {
        val jogo = File("../../jogo")
        val index = File(jogo, "index.html")
        assertTrue("não achei ${index.absolutePath}", index.isFile)
        val refs = Regex("(?:src|href)=\"([^\"]+)\"").findAll(index.readText()).map { it.groupValues[1] }
            .filter { !it.startsWith("data:") && !it.startsWith("#") }.toList()
        assertTrue(refs.isNotEmpty())
        for (r in refs) {
            assertFalse("o index.html não pode carregar $r (teste/ fica fora do APK)", r.startsWith("teste/"))
            assertTrue("falta o arquivo $r", File(jogo, r).isFile)
        }
        assertTrue(File(jogo, "fontes/LICENCA-Fredoka.txt").isFile)
    }

    // ------------------------------------------------------------ oferta, preço e teste grátis
    private val planoBasico = Oferta("mensal", null, "token-plano", listOf(Fase(14_900_000L, "R$ 14,90", "P1M", true, 0)))
    private val ofertaTeste = Oferta(
        "mensal", "teste-gratis", "token-teste",
        listOf(Fase(0L, "Grátis", "P7D", false, 1), Fase(14_900_000L, "R$ 14,90", "P1M", true, 0)),
    )

    @Test
    fun ofertaComTesteGratis() {
        // o Google Play devolve as duas quando a conta tem direito ao teste: vale a do teste
        val e = RegrasAssinatura.escolherOferta(listOf(planoBasico, ofertaTeste))!!
        assertEquals("token-teste", e.token)
        assertEquals("R$ 14,90", e.precoFormatado)
        assertTrue(e.temTeste)
        assertEquals(7, e.diasTeste)
    }

    @Test
    fun ofertaSemDireitoAoTeste() {
        // conta que já assinou antes: só o plano básico vem
        val e = RegrasAssinatura.escolherOferta(listOf(planoBasico))!!
        assertEquals("token-plano", e.token)
        assertEquals("R$ 14,90", e.precoFormatado)
        assertFalse(e.temTeste)
        assertEquals(0, e.diasTeste)
    }

    @Test
    fun ofertasQueNaoSaoDoPlanoFicamDeFora() {
        val promo = Oferta("mensal", "promo-natal", "token-promo", listOf(Fase(9_900_000L, "R$ 9,90", "P1M", true, 0)))
        val anual = Oferta("anual", null, "token-anual", listOf(Fase(99_000_000L, "R$ 99,00", "P1Y", true, 0)))
        assertEquals("token-plano", RegrasAssinatura.escolherOferta(listOf(promo, anual, planoBasico))!!.token)
        assertNull("sem o plano 'mensal' não há o que vender", RegrasAssinatura.escolherOferta(listOf(anual)))
        assertNull(RegrasAssinatura.escolherOferta(emptyList()))
        // uma oferta chamada teste-gratis, mas sem fase grátis, não é teste: fica o plano básico
        val falsa = Oferta("mensal", "teste-gratis", "token-falso", listOf(Fase(14_900_000L, "R$ 14,90", "P1M", true, 0)))
        assertEquals("token-plano", RegrasAssinatura.escolherOferta(listOf(falsa, planoBasico))!!.token)
    }

    @Test
    fun testeGratisEmSemanas() {
        val semana = Oferta("mensal", "teste-gratis", "t", listOf(Fase(0L, "Grátis", "P1W", false, 1), Fase(1L, "R$ 1", "P1M", true, 0)))
        assertEquals(7, RegrasAssinatura.escolherOferta(listOf(semana))!!.diasTeste)
    }

    @Test
    fun diasDoPeriodo() {
        assertEquals(7, RegrasAssinatura.diasDoPeriodo("P7D"))
        assertEquals(7, RegrasAssinatura.diasDoPeriodo("P1W"))
        assertEquals(14, RegrasAssinatura.diasDoPeriodo("P2W"))
        assertEquals(30, RegrasAssinatura.diasDoPeriodo("P1M"))
        assertEquals(365, RegrasAssinatura.diasDoPeriodo("P1Y"))
        assertEquals(0, RegrasAssinatura.diasDoPeriodo(""))
        assertEquals(0, RegrasAssinatura.diasDoPeriodo(null))
    }

    // ------------------------------------------------------------ código de revisão
    @Test
    fun codigoDeRevisao() {
        // maiúsculas/minúsculas e espaços nas pontas não importam; o app guarda só o SHA-256
        assertEquals(RegrasAssinatura.resumoDoCodigo("PIPOCA-2026"), RegrasAssinatura.resumoDoCodigo("  pipoca-2026 "))
        assertEquals(64, RegrasAssinatura.resumoDoCodigo("x").length)
        assertFalse(RegrasAssinatura.resumoDoCodigo("A") == RegrasAssinatura.resumoDoCodigo("B"))
        val guardado = RegrasAssinatura.resumoDoCodigo("Pipoca-2026")
        assertTrue(RegrasAssinatura.codigoConfere("pipoca-2026", guardado))
        assertFalse(RegrasAssinatura.codigoConfere("pipoca-2025", guardado))
        assertFalse(RegrasAssinatura.codigoConfere("   ", guardado))
        assertFalse("sem código no revisao.properties, nada é aceito", RegrasAssinatura.codigoConfere("pipoca-2026", ""))
    }

    // ------------------------------------------------------------ estado decidido (seção 8)
    private val dia = 24 * 60 * 60 * 1000L
    private val agora = 1_800_000_000_000L
    private val base = Conhecido(
        playAtiva = null, cacheAtiva = false, confirmadoEm = 0L, revisaoDesde = 0L, revisaoAte = 0L,
        carregando = false, precoFormatado = "R$ 14,90", temTeste = true, diasTeste = 7,
        pendente = false, indisponivel = false, erro = "",
    )
    private fun decidir(c: Conhecido) = RegrasAssinatura.estado(c, agora)

    @Test
    fun playRespondeuComAssinatura() {
        val e = decidir(base.copy(playAtiva = true))
        assertTrue(e.ativa)
        assertEquals("play", e.origem)
        assertFalse("quem assina não vê o teste grátis", e.temTeste)
        assertEquals(0, e.diasTeste)
    }

    @Test
    fun playRespondeuSemAssinaturaRevogaNaHora() {
        // o cache diz que estava ativa ontem, mas o Google Play respondeu agora que não há assinatura
        val e = decidir(base.copy(playAtiva = false, cacheAtiva = true, confirmadoEm = agora - dia))
        assertFalse(e.ativa)
        assertEquals("", e.origem)
        assertTrue(e.temTeste)
        assertEquals(7, e.diasTeste)
    }

    @Test
    fun semRespostaValeOCacheAteSeteDias() {
        val semResposta = base.copy(playAtiva = null, cacheAtiva = true, erro = "sem-conexao")
        val e1 = decidir(semResposta.copy(confirmadoEm = agora - dia))
        assertTrue(e1.ativa)
        assertEquals("cache", e1.origem)
        assertEquals("sem-conexao", e1.erro)
        assertTrue("7 dias em ponto ainda valem", decidir(semResposta.copy(confirmadoEm = agora - 7 * dia)).ativa)
        assertFalse("depois de 7 dias, modo grátis", decidir(semResposta.copy(confirmadoEm = agora - 7 * dia - 1)).ativa)
        assertFalse("relógio que voltou para antes da confirmação não vale", decidir(semResposta.copy(confirmadoEm = agora + dia)).ativa)
        assertFalse("cache que diz 'não assinante' não libera", decidir(semResposta.copy(cacheAtiva = false, confirmadoEm = agora - dia)).ativa)
        assertFalse("nunca confirmado", decidir(semResposta.copy(confirmadoEm = 0L)).ativa)
    }

    @Test
    fun acessoDeRevisaoValeTrintaDias() {
        val desde = agora - 10 * dia
        val revisao = base.copy(revisaoDesde = desde, revisaoAte = desde + RegrasAssinatura.DURACAO_REVISAO_MS)
        val e = decidir(revisao)
        assertTrue(e.ativa)
        assertEquals("revisao", e.origem)
        assertTrue("mesmo com o Google Play dizendo que não há assinatura", decidir(revisao.copy(playAtiva = false)).ativa)
        assertEquals("o Google Play vem primeiro", "play", decidir(revisao.copy(playAtiva = true)).origem)
        assertFalse("depois dos 30 dias", RegrasAssinatura.estado(revisao, desde + 30 * dia).ativa)
        assertFalse("relógio antes do início", RegrasAssinatura.estado(revisao, desde - 1).ativa)
    }

    @Test
    fun pendenteEIndisponivel() {
        val pendente = decidir(base.copy(playAtiva = false, pendente = true))
        assertTrue(pendente.pendente)
        assertFalse(pendente.ativa)
        assertFalse("assinatura ativa esconde a compra pendente", decidir(base.copy(playAtiva = true, pendente = true)).pendente)
        val bloqueada = decidir(base.copy(indisponivel = true, erro = "play-indisponivel", precoFormatado = "", temTeste = false, diasTeste = 0))
        assertTrue(bloqueada.indisponivel)
        assertEquals("play-indisponivel", bloqueada.erro)
        assertFalse(bloqueada.ativa)
    }

    /** O estado vai para o jogo com exatamente as chaves que jogo/js/assinatura.js lê (e que a ponte falsa manda). */
    @Test
    fun estadoTemAsChavesDoJogo() {
        val json = decidir(base.copy(playAtiva = true, carregando = true)).json()
        val chaves = json.keys().asSequence().toSet()
        assertEquals(
            setOf("ativa", "carregando", "origem", "precoFormatado", "temTeste", "diasTeste", "pendente", "indisponivel", "erro"),
            chaves,
        )
        assertEquals(true, json.get("ativa"))
        assertEquals(true, json.get("carregando"))
        assertEquals("play", json.get("origem"))
        assertEquals("R$ 14,90", json.get("precoFormatado"))
        assertEquals(0, json.get("diasTeste"))
    }
}
