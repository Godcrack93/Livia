package br.livia.pipocaaprende

import org.json.JSONObject
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

/**
 * Regras da assinatura que não dependem do aparelho nem do Google Play (PROJETO.md, seção 8).
 * A [Cobranca] junta o que o Google Play respondeu com o que está guardado no aparelho e pergunta aqui o que vale.
 * Tudo puro, para os testes do PC (RegrasTest) conferirem as decisões.
 */
object RegrasAssinatura {

    const val PRODUTO = "pipoca_mensal"
    const val PLANO = "mensal"
    const val OFERTA_TESTE = "teste-gratis"

    /** Sem resposta do Google Play, a última confirmação de assinatura vale por 7 dias. */
    val VALIDADE_CACHE_MS: Long = TimeUnit.DAYS.toMillis(7)

    /** O código de revisão libera tudo por 30 dias naquele aparelho. */
    val DURACAO_REVISAO_MS: Long = TimeUnit.DAYS.toMillis(30)

    // ------------------------------------------------------------ oferta, preço e teste grátis
    /** Uma fase de preço (cópia simples de ProductDetails.PricingPhase). */
    data class Fase(
        val precoMicros: Long,
        val precoFormatado: String,
        /** Período ISO 8601 ("P7D", "P1W", "P1M"...). */
        val periodo: String,
        /** Renovação sem fim (RecurrenceMode.INFINITE_RECURRING): é o preço da assinatura. */
        val infinita: Boolean,
        val ciclos: Int,
    )

    /** Uma oferta do plano (cópia simples de ProductDetails.SubscriptionOfferDetails). */
    data class Oferta(val planoBasico: String, val idOferta: String?, val token: String, val fases: List<Fase>)

    /** O que o app vende: a oferta escolhida, o preço por mês e o teste grátis (se esta conta tem direito). */
    data class Escolha(val token: String, val precoFormatado: String, val temTeste: Boolean, val diasTeste: Int)

    /**
     * Plano básico 'mensal'. O Google Play só devolve as ofertas a que a conta tem direito: se vier a 'teste-gratis'
     * (com uma fase de preço 0), é ela; senão, o próprio plano básico (oferta sem id). Outras ofertas que alguém
     * crie no Play Console são ignoradas. Fase com preço 0 = teste; fase recorrente P1M = preço por mês.
     * Devolve null se o plano não veio (produto mal configurado ou indisponível para esta conta).
     */
    fun escolherOferta(ofertas: List<Oferta>): Escolha? {
        val doPlano = ofertas.filter { it.planoBasico == PLANO }
        val teste = doPlano.firstOrNull { o -> o.idOferta == OFERTA_TESTE && o.fases.any { it.precoMicros == 0L } }
        val escolhida = teste ?: doPlano.firstOrNull { it.idOferta == null } ?: return null
        val fases = escolhida.fases
        val mensal = fases.lastOrNull { it.infinita && it.periodo == "P1M" }
            ?: fases.lastOrNull { it.infinita }
            ?: fases.lastOrNull { it.precoMicros > 0L }
        val faseTeste = if (teste != null) fases.firstOrNull { it.precoMicros == 0L } else null
        val dias = faseTeste?.let { diasDoPeriodo(it.periodo) * maxOf(1, it.ciclos) } ?: 0
        return Escolha(
            token = escolhida.token,
            precoFormatado = mensal?.precoFormatado.orEmpty(),
            temTeste = faseTeste != null && dias > 0,
            diasTeste = dias,
        )
    }

    /** Dias de um período ISO 8601 do Google Play ("P7D", "P1W", "P1M", "P1Y"…). */
    fun diasDoPeriodo(periodo: String?): Int {
        if (periodo.isNullOrEmpty()) return 0
        var dias = 0
        Regex("(\\d+)([YMWD])").findAll(periodo.uppercase()).forEach { m ->
            val n = m.groupValues[1].toIntOrNull() ?: 0
            dias += when (m.groupValues[2]) {
                "Y" -> n * 365
                "M" -> n * 30
                "W" -> n * 7
                else -> n
            }
        }
        return dias
    }

    // ------------------------------------------------------------ código de revisão
    /**
     * Resumo SHA-256 do código de revisão: o app guarda só isto, nunca o código (o mesmo cálculo do
     * app/build.gradle.kts). Maiúsculas e minúsculas valem igual; espaços nas pontas não contam.
     */
    fun resumoDoCodigo(codigo: String): String {
        val bytes = MessageDigest.getInstance("SHA-256")
            .digest(("br.livia.pipocaaprende:" + codigo.trim().uppercase()).toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    /** O código digitado confere com o resumo guardado no BuildConfig? (resumo vazio = acesso de revisão desligado) */
    fun codigoConfere(digitado: String, resumoEsperado: String): Boolean {
        val limpo = digitado.trim()
        if (resumoEsperado.isEmpty() || limpo.isEmpty()) return false
        return MessageDigest.isEqual(resumoDoCodigo(limpo).toByteArray(), resumoEsperado.toByteArray())
    }

    // ------------------------------------------------------------ estado decidido
    /** Tudo o que se sabe num momento: o que o Google Play disse nesta sessão e o que está guardado no aparelho. */
    data class Conhecido(
        /** true/false = o Google Play respondeu nesta sessão; null = ainda não respondeu ou deu erro. */
        val playAtiva: Boolean?,
        /** Cache (SharedPreferences): a última resposta do Google Play e quando ela veio (ms; 0 = nunca). */
        val cacheAtiva: Boolean,
        val confirmadoEm: Long,
        /** Acesso de revisão: de quando até quando vale (ms; 0 = nunca usado). */
        val revisaoDesde: Long,
        val revisaoAte: Long,
        val carregando: Boolean,
        val precoFormatado: String,
        val temTeste: Boolean,
        val diasTeste: Int,
        val pendente: Boolean,
        val indisponivel: Boolean,
        val erro: String,
    )

    /** Estado no formato que o jogo espera (PROJETO.md 9.3; mensagem {tipo:'assinatura', estado}). */
    data class Estado(
        val ativa: Boolean,
        val carregando: Boolean,
        /** 'play' | 'cache' | 'revisao' | '' */
        val origem: String,
        val precoFormatado: String,
        val temTeste: Boolean,
        val diasTeste: Int,
        val pendente: Boolean,
        val indisponivel: Boolean,
        val erro: String,
    ) {
        fun json(): JSONObject = JSONObject()
            .put("ativa", ativa)
            .put("carregando", carregando)
            .put("origem", origem)
            .put("precoFormatado", precoFormatado)
            .put("temTeste", temTeste)
            .put("diasTeste", diasTeste)
            .put("pendente", pendente)
            .put("indisponivel", indisponivel)
            .put("erro", erro)
    }

    /**
     * Decide se a assinatura vale agora:
     *  - o Google Play respondeu e há assinatura comprada (inclui o teste grátis) → ativa, origem 'play';
     *  - código de revisão dentro dos 30 dias → ativa, origem 'revisao';
     *  - o Google Play respondeu SEM assinatura → não vale (revoga na hora, mesmo com cache);
     *  - o Google Play não respondeu (erro de serviço, rede ou indisponível) → vale o cache por até 7 dias depois
     *    da última confirmação (origem 'cache'); relógio que voltou para antes da confirmação não vale;
     *  - senão, modo grátis.
     */
    fun estado(c: Conhecido, agora: Long): Estado {
        val revisao = c.revisaoAte > 0L && agora >= c.revisaoDesde && agora < c.revisaoAte
        val idade = agora - c.confirmadoEm
        val cache = c.cacheAtiva && c.confirmadoEm > 0L && idade >= 0L && idade <= VALIDADE_CACHE_MS
        val (ativa, origem) = when {
            c.playAtiva == true -> true to "play"
            revisao -> true to "revisao"
            c.playAtiva == null && cache -> true to "cache"
            else -> false to ""
        }
        val temTeste = c.temTeste && c.diasTeste > 0 && !ativa
        return Estado(
            ativa = ativa,
            carregando = c.carregando,
            origem = origem,
            precoFormatado = c.precoFormatado,
            temTeste = temTeste,
            diasTeste = if (temTeste) c.diasTeste else 0,
            pendente = c.pendente && !ativa,
            indisponivel = c.indisponivel,
            erro = c.erro,
        )
    }
}
