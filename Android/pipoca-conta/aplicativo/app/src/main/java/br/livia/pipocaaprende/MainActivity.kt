package br.livia.pipocaaprende

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject
import kotlin.math.ceil

/**
 * Pipoca Aprende — a única tela do app: uma WebView com o jogo (jogo/ dentro do APK) e a ponte com o Android
 * (PROJETO.md, seções 10 e 11): voz (TextToSpeech), assinatura (Google Play Billing), voltar, insets, ciclo de vida.
 */
class MainActivity : ComponentActivity() {

    companion object {
        private const val TAG = "PipocaAprende"
        private const val URL_ASSINATURAS =
            "https://play.google.com/store/account/subscriptions?sku=${Cobranca.PRODUTO}&package="
        /** Se a WebView cair mais que isso em 1 minuto, o app desiste de recriá-la (evita um laço sem fim). */
        private const val MAX_QUEDAS = 3
        /** A tela fica acesa enquanto alguém joga; sem nenhum toque por este tempo, o aparelho pode apagar a tela. */
        private const val TELA_ACESA_SEM_TOQUE_MS = 5 * 60_000L
    }

    private lateinit var raiz: FrameLayout
    private var web: WebView? = null
    /** Aviso ao adulto quando a WebView do aparelho não serve (ver [mostrarAvisoWebView]). */
    private var aviso: TextView? = null
    private lateinit var arquivos: ArquivosDoJogo
    private lateinit var ponte: Ponte
    private lateinit var voz: Voz
    private lateinit var cobranca: Cobranca

    /** Insets (barras + recorte) em dp = px CSS: esquerda, topo, direita, base. */
    private var insets = intArrayOf(0, 0, 0, 0)
    private var naFrente = false
    private var conferirVozAoVoltar = false
    private val quedas = ArrayDeque<Long>()
    private val principal = Handler(Looper.getMainLooper())
    private val apagarTela = Runnable { window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }

    /** Voltar do Android: ligado/desligado pelo jogo ('podeVoltar'); na abertura fica desligado (o sistema cuida). */
    private val voltar = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() = ponte.enviar(Ponte.msg("voltar"))
    }

    // ------------------------------------------------------------------------------------------ ciclo de vida
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        manterTelaAcesa()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        // as teclas de volume mexem no volume de mídia (voz e sons do jogo), mesmo em silêncio
        volumeControlStream = AudioManager.STREAM_MUSIC

        arquivos = ArquivosDoJogo(assets)
        ponte = Ponte(::receber, ::estadoInicial, ::aoJogoPronto)

        raiz = FrameLayout(this).apply { setBackgroundColor(ContextCompat.getColor(this@MainActivity, R.color.fundo)) }
        setContentView(raiz)
        ViewCompat.setOnApplyWindowInsetsListener(raiz) { _, wi ->
            atualizarInsets(wi)
            WindowInsetsCompat.CONSUMED      // a WebView ocupa a tela toda; o jogo usa os insets que mandamos
        }
        onBackPressedDispatcher.addCallback(this, voltar)

        voz = Voz(
            applicationContext,
            aoMudar = { disponivel, motivo -> ponte.enviar(Ponte.voz(disponivel, motivo)) },
            aoTerminar = { id, motivo -> ponte.enviar(Ponte.vozFim(id, motivo)) },
        )
        cobranca = Cobranca(this) { estado -> ponte.enviar(Ponte.assinatura(estado)) }
        voz.iniciar()
        cobranca.iniciar()

        // WebView sem addWebMessageListener (antiga demais), ausente ou sendo atualizada: aviso ao adulto, sem fechar
        val temPonte = try {
            WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)
        } catch (e: Exception) {
            Log.e(TAG, "WebView indisponível", e)
            false
        }
        if (!temPonte || !criarWebView()) mostrarAvisoWebView()
    }

    override fun onResume() {
        super.onResume()
        naFrente = true
        manterTelaAcesa()
        esconderBarras()
        web?.let { it.onResume(); it.resumeTimers() }
        if (ponte.pronto) ponte.enviar(Ponte.msg("retomar"))
        cobranca.aoRetomar()
        // voltou dos ajustes de voz (ou a voz tinha falhado): tenta ligar a voz de novo
        if (conferirVozAoVoltar || voz.precisaTentarDeNovo()) {
            conferirVozAoVoltar = false
            voz.iniciar()
        }
    }

    override fun onPause() {
        naFrente = false
        if (ponte.pronto) ponte.enviar(Ponte.msg("pausa"))
        voz.parar()
        web?.let { it.onPause(); it.pauseTimers() }
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) esconderBarras()
    }

    /** Cada toque renova o "tela acesa" (FLAG_KEEP_SCREEN_ON durante o jogo). */
    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        if (ev.actionMasked == MotionEvent.ACTION_DOWN) manterTelaAcesa()
        return super.dispatchTouchEvent(ev)
    }

    private fun manterTelaAcesa() {
        // addFlags refaz o layout da janela toda vez: só mexe na bandeira quando ela muda, não a cada toque
        if ((window.attributes.flags and WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) == 0) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        principal.removeCallbacks(apagarTela)
        principal.postDelayed(apagarTela, TELA_ACESA_SEM_TOQUE_MS)
    }

    override fun onDestroy() {
        principal.removeCallbacksAndMessages(null)
        if (::voz.isInitialized) voz.encerrar()
        if (::cobranca.isInitialized) cobranca.encerrar()
        web?.let { w ->
            raiz.removeView(w)
            w.destroy()
        }
        web = null
        super.onDestroy()
    }

    // ------------------------------------------------------------------------------------------ WebView
    /** Cria a WebView e abre o jogo. Devolve false se a WebView do aparelho não abrir (ausente ou atualizando). */
    private fun criarWebView(): Boolean = try {
        montarWebView()
        true
    } catch (e: Exception) {
        Log.e(TAG, "não consegui criar a WebView", e)
        web?.let { w -> raiz.removeView(w); try { w.destroy() } catch (e2: Exception) { /* ok */ } }
        web = null
        false
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun montarWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        val w = WebView(this)
        web = w                                           // se algo abaixo falhar, criarWebView() desfaz
        w.setBackgroundColor(ContextCompat.getColor(this, R.color.fundo))
        w.isLongClickable = false
        w.setOnLongClickListener { true }                 // sem menu de toque longo nem seleção
        w.isHapticFeedbackEnabled = true
        w.overScrollMode = View.OVER_SCROLL_NEVER
        w.isVerticalScrollBarEnabled = false
        w.isHorizontalScrollBarEnabled = false
        w.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true                      // localStorage: o progresso da criança
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            blockNetworkLoads = true                      // nada de internet dentro do jogo
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            textZoom = 100                                // a fonte do sistema não deforma o jogo
            setGeolocationEnabled(false)
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            cacheMode = WebSettings.LOAD_NO_CACHE         // tudo vem do APK
            safeBrowsingEnabled = false
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(w.settings, false)   // o modo escuro não "pinta" o jogo
        }
        w.webViewClient = Cliente()
        if (BuildConfig.DEBUG) w.webChromeClient = ConsoleNoLogcat()
        // a ponte: registrada ANTES do loadUrl e só para a origem do app (o onCreate já conferiu o recurso)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(w, Ponte.NOME_OBJETO, setOf(ArquivosDoJogo.ORIGEM), ponte.ouvinte)
        }
        aviso?.let { raiz.removeView(it) }
        aviso = null
        raiz.addView(w, 0, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        ponte.reiniciar()
        voltar.isEnabled = false
        w.loadUrl(ArquivosDoJogo.PAGINA_INICIAL)
        // criada com o app fora da frente (no onCreate ou depois de uma queda): fica pausada até o onResume
        if (!naFrente) w.onPause()
    }

    /** O processo da WebView caiu (falta de memória ou falha): troca por uma WebView nova (PROJETO.md 11). */
    private fun recriarWebView(velha: WebView) {
        if (web !== velha) return
        web = null
        raiz.removeView(velha)
        velha.destroy()
        val agora = SystemClock.elapsedRealtime()
        quedas.addLast(agora)
        while (quedas.isNotEmpty() && agora - quedas.first() > 60_000L) quedas.removeFirst()
        if (quedas.size > MAX_QUEDAS) {
            Log.e(TAG, "a WebView caiu ${quedas.size} vezes em 1 minuto; fechando o app")
            finish()
            return
        }
        if (!criarWebView()) mostrarAvisoWebView()
    }

    private inner class Cliente : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            arquivos.responder(request.url)

        /** Só a origem do app abre dentro do jogo; qualquer outro endereço é bloqueado. */
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val u = request.url
            return !(u.scheme == "https" && ArquivosDoJogo.HOST.equals(u.host, ignoreCase = true))
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            if (view !== web) return
            ponte.reiniciar()           // página nova: espera outro 'pronto'
            voltar.isEnabled = false
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            Log.w(TAG, "processo da WebView caiu (falha: ${detail.didCrash()})")
            recriarWebView(view)
            return true
        }
    }

    /** Só no APK de depuração: mensagens do console do jogo no Logcat. */
    private class ConsoleNoLogcat : WebChromeClient() {
        override fun onConsoleMessage(m: ConsoleMessage): Boolean {
            Log.d("PipocaJS", "${m.messageLevel()} ${m.message()} (${m.sourceId()}:${m.lineNumber()})")
            return true
        }
    }

    /** WebView antiga demais (sem addWebMessageListener) ou que não abriu: explica ao adulto o que fazer. */
    private fun mostrarAvisoWebView() {
        if (aviso != null) return
        voltar.isEnabled = false                          // sem jogo, o voltar do sistema fecha o app
        val texto = TextView(this).apply {
            text = getString(R.string.aviso_webview)
            setTextColor(ContextCompat.getColor(this@MainActivity, R.color.tinta))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
            gravity = Gravity.CENTER
            val m = (32 * resources.displayMetrics.density).toInt()
            setPadding(m, m, m, m)
        }
        raiz.addView(texto, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        aviso = texto
    }

    // ------------------------------------------------------------------------------------------ ponte
    /** Pacote do 'estado' (resposta ao 'pronto'): voz, assinatura e insets atuais. */
    private fun estadoInicial(): JSONObject = Ponte.estado(
        voz = Ponte.dadosVoz(voz.disponivel, voz.motivo),
        assinatura = cobranca.estado(),
        insets = Ponte.dadosInsets(insets[0], insets[1], insets[2], insets[3]),
        depuracao = BuildConfig.DEBUG,          // APK de teste: o jogo deixa ligar o modo desenvolvedor
    )

    /** Logo depois do 'pronto': se o app já está em segundo plano, o jogo precisa saber. */
    private fun aoJogoPronto() {
        if (!naFrente) ponte.enviar(Ponte.msg("pausa"))
    }

    /** Mensagens do jogo (JS → Android), sempre na thread principal. */
    private fun receber(m: JSONObject) {
        when (m.optString("tipo")) {
            "pronto" -> if (BuildConfig.DEBUG) Log.i(TAG, "jogo pronto (versão ${texto(m, "versao")})")
            "falar" -> voz.falar(
                texto(m, "texto"), texto(m, "id"),
                m.optDouble("velocidade", 0.9).toFloat(), m.optDouble("volume", 1.0).toFloat(),
            )
            "pararFala" -> voz.parar()
            "assinar" -> cobranca.assinar(this)
            "restaurar" -> cobranca.restaurar()
            "gerenciar" -> abrirNoNavegador(URL_ASSINATURAS + packageName)
            "codigoRevisao" -> {
                val ok = cobranca.usarCodigoRevisao(texto(m, "codigo"))
                ponte.enviar(Ponte.codigoRevisao(ok))     // como na ponte falsa: a resposta e, se certo, o estado novo
                if (ok) cobranca.notificar(forcar = true)
            }
            "abrirAjustesVoz" -> abrirAjustesVoz()
            "abrirPrivacidade" -> if (BuildConfig.PRIVACIDADE_URL.isNotEmpty()) abrirNoNavegador(BuildConfig.PRIVACIDADE_URL)
            "vibrar" -> vibrar(m.optInt("ms", 20))
            "podeVoltar" -> voltar.isEnabled = m.optBoolean("valor", false)
            "sair" -> moveTaskToBack(true)
            else -> if (BuildConfig.DEBUG) Log.w(TAG, "mensagem desconhecida: $m")
        }
    }

    /** Texto de um campo (vazio se faltar ou for null). */
    private fun texto(m: JSONObject, chave: String): String = if (m.isNull(chave)) "" else m.optString(chave, "")

    /** Barras do sistema + recorte da câmera, em dp (= px CSS). Escondidas, as barras valem 0. */
    private fun atualizarInsets(wi: WindowInsetsCompat) {
        val b = wi.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
        val d = resources.displayMetrics.density
        val novo = intArrayOf(
            ceil(b.left / d).toInt(), ceil(b.top / d).toInt(), ceil(b.right / d).toInt(), ceil(b.bottom / d).toInt(),
        )
        if (novo.contentEquals(insets)) return
        insets = novo
        ponte.enviar(Ponte.insets(novo[0], novo[1], novo[2], novo[3]))
    }

    private fun esconderBarras() {
        val c = WindowCompat.getInsetsController(window, window.decorView)
        c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        c.hide(WindowInsetsCompat.Type.systemBars())
    }

    /** Toque que vibra de leve (performHapticFeedback não precisa de permissão). */
    private fun vibrar(ms: Int) {
        val alvo = web ?: raiz
        val tipo = when {
            ms <= 20 -> HapticFeedbackConstants.CLOCK_TICK
            ms <= 60 -> HapticFeedbackConstants.VIRTUAL_KEY
            else -> HapticFeedbackConstants.LONG_PRESS
        }
        alvo.performHapticFeedback(tipo)
    }

    /** Links externos (o jogo só pede depois do portão dos adultos). Só https. */
    private fun abrirNoNavegador(url: String) {
        val u = Uri.parse(url)
        if (u.scheme != "https") return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, u).addCategory(Intent.CATEGORY_BROWSABLE))
        } catch (e: ActivityNotFoundException) {
            Log.w(TAG, "nenhum app abre $url")
        }
    }

    /** Instalação da voz em português (motor de voz do aparelho); se não houver, os ajustes de voz. */
    private fun abrirAjustesVoz() {
        conferirVozAoVoltar = true
        val instalar = Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)
        val tentativas = listOfNotNull(
            voz.motorPadrao()?.let { Intent(instalar).setPackage(it) },
            instalar,
            Intent("com.android.settings.TTS_SETTINGS"),
            Intent(Settings.ACTION_SETTINGS),
        )
        for (i in tentativas) {
            try {
                startActivity(i)
                return
            } catch (e: ActivityNotFoundException) {
                // tenta a próxima
            } catch (e: SecurityException) {
                // tenta a próxima
            }
        }
    }
}
