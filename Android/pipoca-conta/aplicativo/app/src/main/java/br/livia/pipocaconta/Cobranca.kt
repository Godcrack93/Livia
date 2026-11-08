package br.livia.pipocaconta

import android.app.Activity
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONObject

/**
 * Assinatura pelo Google Play Billing 9.1.0 (PROJETO.md, seção 8) e acesso de revisão.
 *
 * O jogo só recebe o estado já decidido ([estado]):
 *   {ativa, carregando, origem: 'play'|'cache'|'revisao'|'', precoFormatado, temTeste, diasTeste,
 *    pendente, indisponivel, erro}
 *
 * Decisão (as regras puras ficam em [RegrasAssinatura], testadas no PC):
 *  - o Google Play respondeu e há assinatura comprada (inclui o teste grátis) → ativa, origem 'play';
 *  - respondeu sem assinatura → revoga na hora (e o cache passa a dizer "não");
 *  - não respondeu (erro de serviço, rede ou Play indisponível) → vale o cache {ativa, confirmadoEm} por até
 *    7 dias depois da última confirmação (origem 'cache'); depois, modo grátis;
 *  - código de revisão certo → tudo liberado por 30 dias naquele aparelho (origem 'revisao').
 * Erros vão em 'erro' com códigos curtos que a área dos pais traduz (jogo/js/telas/pais.js, textoErro):
 *   'play-indisponivel', 'sem-conexao', 'servico-sem-resposta', 'compra-cancelada', 'item-already-owned',
 *   'produto-nao-encontrado', 'pagamento-recusado', 'erro-play'.
 *
 * Use só na thread principal (os retornos da biblioteca são repassados para ela).
 */
class Cobranca(
    contexto: Context,
    private val aoMudar: (JSONObject) -> Unit,
) : PurchasesUpdatedListener {

    companion object {
        private const val TAG = "PipocaCobranca"
        const val PRODUTO = RegrasAssinatura.PRODUTO
        private const val PREFS = "pipoca_assinatura"
        private const val MAX_ERROS_CODIGO = 5
        private const val ESPERA_CODIGO_MS = 60_000L
        /** Sem resposta do Google Play neste tempo, o jogo deixa de mostrar "Consultando o Google Play…". */
        private const val ESPERA_RESPOSTA_MS = 15_000L
    }

    private val principal = Handler(Looper.getMainLooper())
    private val prefs = contexto.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val cliente: BillingClient = BillingClient.newBuilder(contexto.applicationContext)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()

    // ------------------------------------------------------------ estado conhecido
    /** true = o Play confirmou assinatura; false = confirmou que não há; null = ainda não sabemos (ou erro). */
    private var playAtiva: Boolean? = null
    private var carregando = true
    private var pendente = false
    private var indisponivel = false
    private var erro = ""
    private var preco = ""
    private var temTeste = false
    private var diasTeste = 0
    private var detalhes: ProductDetails? = null
    private var tokenOferta: String? = null

    private var configurado = false
    private var conectando = false
    private var encerrada = false
    private var consultandoCompras = false
    private var consultarComprasDeNovo = false
    private var consultandoProduto = false
    private val reconhecendo = mutableSetOf<String>()
    private var errosCodigo = 0
    private var codigoBloqueadoAte = 0L
    private var ultimoEnviado = ""

    /** Liga a conexão com o Google Play (abertura do app). */
    fun iniciar() {
        conectar()
        vigiarCarregando()
    }

    /** Se o Google Play não responder em 15 s, o jogo deixa de mostrar "consultando" e recebe o aviso de erro. */
    private val desistirDeEsperar = Runnable {
        if (!encerrada && carregando) {
            carregando = false
            if (erro.isEmpty()) erro = "servico-sem-resposta"
            notificar(forcar = true)
        }
    }

    private fun vigiarCarregando() {
        principal.removeCallbacks(desistirDeEsperar)
        principal.postDelayed(desistirDeEsperar, ESPERA_RESPOSTA_MS)
    }

    /** O app voltou para a frente: confere as compras de novo (e o preço, se ainda não veio). */
    fun aoRetomar() {
        if (encerrada) return
        if (!configurado) { conectar(); return }
        consultarCompras()
        if (detalhes == null) consultarProduto()
    }

    fun encerrar() {
        encerrada = true
        principal.removeCallbacksAndMessages(null)
        try { cliente.endConnection() } catch (e: Exception) { /* ok */ }
    }

    // ------------------------------------------------------------ conexão
    private fun conectar() {
        if (encerrada || conectando) return
        when (cliente.connectionState) {
            BillingClient.ConnectionState.CONNECTED -> {
                configurado = true
                consultarCompras()
                consultarProduto()
                return
            }
            // a reconexão automática já está em andamento: confere de novo daqui a pouco
            BillingClient.ConnectionState.CONNECTING -> { principal.postDelayed({ conectar() }, 1500L); return }
            BillingClient.ConnectionState.CLOSED -> return
        }
        conectando = true
        try {
            cliente.startConnection(object : BillingClientStateListener {
                override fun onBillingSetupFinished(resultado: BillingResult) {
                    principal.post { aoConectar(resultado) }
                }
                override fun onBillingServiceDisconnected() {
                    // enableAutoServiceReconnection(): a biblioteca reconecta sozinha na próxima chamada.
                    principal.post { conectando = false }
                }
            })
        } catch (e: Exception) {
            conectando = false
            Log.w(TAG, "startConnection falhou", e)
            erro = "erro-play"
            carregando = false
            notificar()
        }
    }

    private fun aoConectar(resultado: BillingResult) {
        conectando = false
        if (encerrada) return
        if (resultado.responseCode == BillingResponseCode.OK) {
            configurado = true
            if (indisponivel) { indisponivel = false; if (erro == "play-indisponivel") erro = "" }
            consultarCompras()
            consultarProduto()
            return
        }
        if (BuildConfig.DEBUG) Log.w(TAG, "conexão: ${resultado.responseCode} ${resultado.debugMessage}")
        anotarErro(resultado)
        playAtiva = null
        carregando = false
        notificar(forcar = true)
    }

    // ------------------------------------------------------------ compras
    private fun consultarCompras() {
        if (encerrada) return
        if (consultandoCompras) { consultarComprasDeNovo = true; return }
        consultandoCompras = true
        val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        try {
            cliente.queryPurchasesAsync(params) { resultado, compras ->
                principal.post { aoConsultarCompras(resultado, compras) }
            }
        } catch (e: Exception) {
            consultandoCompras = false
            Log.w(TAG, "queryPurchasesAsync falhou", e)
        }
    }

    private fun aoConsultarCompras(resultado: BillingResult, compras: List<Purchase>?) {
        consultandoCompras = false
        if (encerrada) return
        if (resultado.responseCode == BillingResponseCode.OK) {
            val nossas = compras.orEmpty().filter { PRODUTO in it.products }
            val ativa = nossas.any { it.purchaseState == Purchase.PurchaseState.PURCHASED }
            pendente = !ativa && nossas.any { it.purchaseState == Purchase.PurchaseState.PENDING }
            playAtiva = ativa
            prefs.edit().putBoolean("ativa", ativa).putLong("confirmadoEm", System.currentTimeMillis()).apply()
            indisponivel = false
            if (ativa || erro in setOf("play-indisponivel", "sem-conexao", "servico-sem-resposta", "erro-play")) erro = ""
            nossas.forEach { reconhecer(it) }
        } else {
            if (BuildConfig.DEBUG) Log.w(TAG, "compras: ${resultado.responseCode} ${resultado.debugMessage}")
            playAtiva = null          // não sabemos: vale o cache de 7 dias
            anotarErro(resultado)
        }
        carregando = false
        notificar(forcar = true)
        if (consultarComprasDeNovo) {
            consultarComprasDeNovo = false
            consultarCompras()
        }
    }

    /** Reconhece (acknowledge) uma compra paga e ainda não reconhecida. Se falhar, a próxima consulta tenta de novo. */
    private fun reconhecer(compra: Purchase) {
        if (compra.purchaseState != Purchase.PurchaseState.PURCHASED || compra.isAcknowledged) return
        val token = compra.purchaseToken
        if (!reconhecendo.add(token)) return
        val params = AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build()
        try {
            cliente.acknowledgePurchase(params) { resultado ->
                principal.post {
                    reconhecendo.remove(token)
                    if (resultado.responseCode != BillingResponseCode.OK) {
                        Log.w(TAG, "acknowledge falhou (${resultado.responseCode}); tento de novo na próxima consulta")
                    }
                }
            }
        } catch (e: Exception) {
            reconhecendo.remove(token)
            Log.w(TAG, "acknowledgePurchase falhou", e)
        }
    }

    /** Retorno do fluxo de compra (e de compras pendentes que se resolveram com o app aberto). */
    override fun onPurchasesUpdated(resultado: BillingResult, compras: MutableList<Purchase>?) {
        principal.post { aoAtualizarCompras(resultado, compras) }
    }

    private fun aoAtualizarCompras(resultado: BillingResult, compras: List<Purchase>?) {
        if (encerrada) return
        when (resultado.responseCode) {
            BillingResponseCode.OK -> {
                val nossas = compras.orEmpty().filter { PRODUTO in it.products }
                if (nossas.any { it.purchaseState == Purchase.PurchaseState.PURCHASED }) {
                    playAtiva = true
                    pendente = false
                    erro = ""
                    prefs.edit().putBoolean("ativa", true).putLong("confirmadoEm", System.currentTimeMillis()).apply()
                } else if (nossas.any { it.purchaseState == Purchase.PurchaseState.PENDING }) {
                    pendente = true
                }
                nossas.forEach { reconhecer(it) }
                consultarCompras()     // confirma o quadro completo
            }
            BillingResponseCode.ITEM_ALREADY_OWNED -> {
                erro = "item-already-owned"
                consultarCompras()
            }
            else -> anotarErro(resultado)
        }
        carregando = false
        notificar(forcar = true)
    }

    // ------------------------------------------------------------ produto, preço e teste grátis
    private fun consultarProduto() {
        if (encerrada || consultandoProduto) return
        consultandoProduto = true
        val produto = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PRODUTO)
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        val params = QueryProductDetailsParams.newBuilder().setProductList(listOf(produto)).build()
        try {
            cliente.queryProductDetailsAsync(params) { resultado, consulta ->
                val lista = consulta.productDetailsList
                val faltaram = consulta.unfetchedProductList
                principal.post { aoConsultarProduto(resultado, lista, faltaram.map { "${it.productId}:${it.statusCode}" }) }
            }
        } catch (e: Exception) {
            consultandoProduto = false
            Log.w(TAG, "queryProductDetailsAsync falhou", e)
        }
    }

    private fun aoConsultarProduto(resultado: BillingResult, lista: List<ProductDetails>, faltaram: List<String>) {
        consultandoProduto = false
        if (encerrada) return
        if (resultado.responseCode != BillingResponseCode.OK) {
            if (BuildConfig.DEBUG) Log.w(TAG, "produto: ${resultado.responseCode} ${resultado.debugMessage}")
            if (detalhes == null) anotarErro(resultado)
            notificar()
            return
        }
        val d = lista.firstOrNull { it.productId == PRODUTO }
        if (d == null || !escolherOferta(d)) {
            // produto não configurado no Play Console (ou sem plano 'mensal' para esta conta)
            Log.w(TAG, "assinatura $PRODUTO não veio do Google Play: $faltaram")
            detalhes = null; tokenOferta = null; preco = ""; temTeste = false; diasTeste = 0
            if (erro.isEmpty() || erro in setOf("sem-conexao", "servico-sem-resposta", "erro-play")) erro = "produto-nao-encontrado"
        } else if (erro in setOf("produto-nao-encontrado", "sem-conexao", "servico-sem-resposta", "erro-play")) {
            erro = ""
        }
        notificar()
    }

    /**
     * Plano básico 'mensal'; usa a oferta 'teste-gratis' quando o Google Play a devolve (ele só devolve as ofertas
     * para as quais a conta tem direito). Fase com preço 0 = teste; fase recorrente P1M = preço por mês.
     * A escolha em si é de [RegrasAssinatura.escolherOferta].
     */
    private fun escolherOferta(d: ProductDetails): Boolean {
        val ofertas = d.subscriptionOfferDetails.orEmpty().map { o ->
            RegrasAssinatura.Oferta(
                planoBasico = o.basePlanId,
                idOferta = o.offerId,
                token = o.offerToken,
                fases = o.pricingPhases.pricingPhaseList.map { f ->
                    RegrasAssinatura.Fase(
                        precoMicros = f.priceAmountMicros,
                        precoFormatado = f.formattedPrice,
                        periodo = f.billingPeriod,
                        infinita = f.recurrenceMode == ProductDetails.RecurrenceMode.INFINITE_RECURRING,
                        ciclos = f.billingCycleCount,
                    )
                },
            )
        }
        val escolha = RegrasAssinatura.escolherOferta(ofertas) ?: return false
        detalhes = d
        tokenOferta = escolha.token
        preco = escolha.precoFormatado
        temTeste = escolha.temTeste
        diasTeste = escolha.diasTeste
        return true
    }

    // ------------------------------------------------------------ pedidos do jogo
    /** Abre a compra do Google Play (o jogo só pede depois do portão dos adultos). */
    fun assinar(atividade: Activity) {
        if (encerrada) return
        erro = ""
        val d = detalhes
        val token = tokenOferta
        when {
            indisponivel -> erro = "play-indisponivel"
            d == null || token == null -> {
                erro = "sem-conexao"
                if (!configurado) conectar() else consultarProduto()
            }
            else -> {
                val params = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(
                        listOf(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(d)
                                .setOfferToken(token)
                                .build()
                        )
                    )
                    .build()
                val r = try {
                    cliente.launchBillingFlow(atividade, params)
                } catch (e: Exception) {
                    Log.w(TAG, "launchBillingFlow falhou", e)
                    BillingResult.newBuilder().setResponseCode(BillingResponseCode.ERROR).build()
                }
                when (r.responseCode) {
                    BillingResponseCode.OK -> { /* a tela do Google Play abriu; o resultado chega em onPurchasesUpdated */ }
                    BillingResponseCode.ITEM_ALREADY_OWNED -> { erro = "item-already-owned"; consultarCompras() }
                    else -> anotarErro(r)
                }
            }
        }
        notificar(forcar = true)
    }

    /** "Restaurar compra": consulta tudo de novo e sempre responde (o jogo fica em 'carregando' até lá). */
    fun restaurar() {
        if (encerrada) return
        erro = ""
        carregando = true
        notificar(forcar = true)
        vigiarCarregando()
        if (!configurado) { conectar(); return }
        consultarCompras()
        consultarProduto()
    }

    /** Confere o código de revisão. Certo → libera tudo por 30 dias neste aparelho. */
    fun usarCodigoRevisao(codigo: String): Boolean {
        val agora = SystemClock.elapsedRealtime()
        if (agora < codigoBloqueadoAte) return false
        if (!RegrasAssinatura.codigoConfere(codigo, BuildConfig.CODIGO_REVISAO_SHA256)) {
            if (++errosCodigo >= MAX_ERROS_CODIGO) {
                errosCodigo = 0
                codigoBloqueadoAte = agora + ESPERA_CODIGO_MS
            }
            return false
        }
        errosCodigo = 0
        val hoje = System.currentTimeMillis()
        prefs.edit().putLong("revisaoDesde", hoje).putLong("revisaoAte", hoje + RegrasAssinatura.DURACAO_REVISAO_MS).apply()
        return true                // quem chamou responde 'codigoRevisao' e depois manda o estado novo (notificar)
    }

    // ------------------------------------------------------------ estado
    /** Estado decidido, no formato que o jogo espera (PROJETO.md 9.3). */
    fun estado(): JSONObject = RegrasAssinatura.estado(
        RegrasAssinatura.Conhecido(
            playAtiva = playAtiva,
            cacheAtiva = prefs.getBoolean("ativa", false),
            confirmadoEm = prefs.getLong("confirmadoEm", 0L),
            revisaoDesde = prefs.getLong("revisaoDesde", 0L),
            revisaoAte = prefs.getLong("revisaoAte", 0L),
            carregando = carregando,
            precoFormatado = preco,
            temTeste = temTeste,
            diasTeste = diasTeste,
            pendente = pendente,
            indisponivel = indisponivel,
            erro = erro,
        ),
        System.currentTimeMillis(),
    ).json()

    /** Manda o estado ao jogo (só se mudou, ou sempre com forcar). */
    fun notificar(forcar: Boolean = false) {
        val e = estado()
        val texto = e.toString()
        if (!forcar && texto == ultimoEnviado) return
        ultimoEnviado = texto
        aoMudar(e)
    }

    /** Traduz um erro do Google Play para o código curto do jogo. */
    @Suppress("DEPRECATION")     // SERVICE_TIMEOUT: obsoleto, mas versões antigas da Play Store ainda podem mandar
    private fun anotarErro(r: BillingResult) {
        when (r.responseCode) {
            BillingResponseCode.OK -> {}
            BillingResponseCode.USER_CANCELED -> erro = "compra-cancelada"
            BillingResponseCode.ITEM_ALREADY_OWNED -> erro = "item-already-owned"
            BillingResponseCode.BILLING_UNAVAILABLE -> { indisponivel = true; erro = "play-indisponivel" }
            BillingResponseCode.NETWORK_ERROR -> erro = "sem-conexao"
            BillingResponseCode.SERVICE_UNAVAILABLE,
            BillingResponseCode.SERVICE_DISCONNECTED,
            BillingResponseCode.SERVICE_TIMEOUT -> erro = "servico-sem-resposta"
            BillingResponseCode.ITEM_UNAVAILABLE -> erro = "produto-nao-encontrado"
            else -> erro = when (r.onPurchasesUpdatedSubResponseCode) {
                BillingClient.OnPurchasesUpdatedSubResponseCode.PAYMENT_DECLINED_DUE_TO_INSUFFICIENT_FUNDS,
                BillingClient.OnPurchasesUpdatedSubResponseCode.USER_INELIGIBLE -> "pagamento-recusado"
                else -> "erro-play"
            }
        }
    }
}
