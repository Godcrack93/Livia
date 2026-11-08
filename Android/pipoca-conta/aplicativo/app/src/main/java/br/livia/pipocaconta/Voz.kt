package br.livia.pipocaconta

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import android.util.Log
import java.util.Locale

/**
 * Voz da Pipoca: o TextToSpeech do aparelho, em português do Brasil (PROJETO.md, seções 6.1, 10 e 11).
 *
 * - Criado no onCreate; só fala depois do onInit. O pedido que chega antes fica guardado (só o último vale,
 *   porque cada fala nova interrompe a anterior).
 * - setLanguage(pt-BR): LANG_MISSING_DATA ou LANG_NOT_SUPPORTED → voz indisponível ('sem-ptbr'); motor que não
 *   inicia → 'sem-motor'. Entre as vozes pt-BR, prefere uma que funcione sem internet.
 * - Cada fala termina com [aoTerminar] (id, 'fim' | 'interrompida' | 'erro'), sempre na thread principal.
 * - [aoMudar] avisa quando a disponibilidade muda (disponivel, motivo: '' | 'iniciando' | 'sem-ptbr' | 'sem-motor').
 *
 * Use só na thread principal.
 */
class Voz(
    private val contexto: Context,
    private val aoMudar: (disponivel: Boolean, motivo: String) -> Unit,
    private val aoTerminar: (id: String, motivo: String) -> Unit,
) {
    companion object {
        private const val TAG = "PipocaVoz"
        private val PT_BR: Locale = Locale.forLanguageTag("pt-BR")
        /** Pedido guardado antes do onInit vale por este tempo (depois o jogo já seguiu sem ele). */
        private const val VALIDADE_PEDIDO_MS = 4000L
    }

    private class Pedido(val texto: String, val id: String, val velocidade: Float, val volume: Float, val quando: Long)

    private val principal = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var geracao = 0
    private var iniciada = false
    private var guardado: Pedido? = null
    private var falhasSeguidas = 0
    /** Id da fala que o motor está falando agora (para responder 'interrompida' se o motor for religado). */
    private var falando: String? = null

    /** A voz pt-BR está pronta para falar? (vai para o jogo em 'voz' e no pacote 'estado') */
    var disponivel = false
        private set
    /** '' | 'iniciando' | 'sem-ptbr' | 'sem-motor' */
    var motivo = "iniciando"
        private set

    /** Pacote do motor de voz padrão (para abrir a instalação de vozes dele), se já iniciou. */
    fun motorPadrao(): String? = try { tts?.defaultEngine } catch (e: Exception) { null }

    /** Liga o motor de voz (de novo, se já estava ligado). */
    fun iniciar() {
        desligarMotor()
        val g = ++geracao
        iniciada = false
        mudar(false, "iniciando")
        try {
            tts = TextToSpeech(contexto) { status -> principal.post { if (g == geracao) aoIniciar(status) } }
        } catch (e: Exception) {
            Log.w(TAG, "TextToSpeech não abriu", e)
            tts = null
            iniciada = true
            mudar(false, "sem-motor")
            responderGuardado("erro")
        }
    }

    /** A voz falhou ao iniciar? (vale tentar de novo quando o app volta, por exemplo depois de instalar a voz) */
    fun precisaTentarDeNovo() = iniciada && !disponivel

    private fun aoIniciar(status: Int) {
        iniciada = true
        val t = tts
        if (status != TextToSpeech.SUCCESS || t == null) {
            mudar(false, "sem-motor")
            responderGuardado("erro")
            return
        }
        val idioma = try { t.setLanguage(PT_BR) } catch (e: Exception) { TextToSpeech.LANG_NOT_SUPPORTED }
        // LANG_AVAILABLE = o motor tem "português", mas não o do Brasil: falaria com sotaque de Portugal
        // ("dezassete", "catorze"). Só serve se houver uma voz pt-BR instalada para escolher abaixo.
        val semBrasil = idioma == TextToSpeech.LANG_AVAILABLE && vozesPtBr(t).none { !it.isNetworkConnectionRequired }
        if (idioma == TextToSpeech.LANG_MISSING_DATA || idioma == TextToSpeech.LANG_NOT_SUPPORTED || semBrasil) {
            mudar(false, "sem-ptbr")
            responderGuardado("erro")
            return
        }
        preferirVozSemInternet(t)
        try {
            t.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
        } catch (e: Exception) { /* motores antigos: segue com o padrão */ }
        val g = geracao
        t.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) = terminou(g, utteranceId, "fim")
            override fun onStop(utteranceId: String?, interrupted: Boolean) = terminou(g, utteranceId, "interrompida")
            @Deprecated("Substituído por onError(String, Int)")
            override fun onError(utteranceId: String?) = terminou(g, utteranceId, "erro")
            override fun onError(utteranceId: String?, errorCode: Int) = terminou(g, utteranceId, "erro")
        })
        falhasSeguidas = 0
        mudar(true, "")
        val p = guardado
        guardado = null
        if (p != null) {
            if (SystemClock.elapsedRealtime() - p.quando <= VALIDADE_PEDIDO_MS) falar(p.texto, p.id, p.velocidade, p.volume)
            else aoTerminar(p.id, "erro")
        }
    }

    /** Entre as vozes pt-BR instaladas, prefere uma que não precise de internet (a padrão, se ela servir). */
    private fun preferirVozSemInternet(t: TextToSpeech) {
        try {
            val boas = vozesPtBr(t).filter { !it.isNetworkConnectionRequired }
            if (boas.isEmpty()) return
            val atual = t.voice
            if (atual != null && boas.any { it.name == atual.name }) return
            val melhor = boas.maxWithOrNull(compareBy<Voice>({ it.quality }, { -it.latency })) ?: return
            t.voice = melhor
        } catch (e: Exception) {
            Log.w(TAG, "não consegui escolher a voz", e)
        }
    }

    /** Vozes pt-BR já instaladas no aparelho (lista vazia se o motor não informar). */
    private fun vozesPtBr(t: TextToSpeech): List<Voice> = try {
        t.voices.orEmpty().filter { v ->
            v.locale.language == "pt" && v.locale.country.equals("BR", ignoreCase = true) &&
                v.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) != true
        }
    } catch (e: Exception) {
        emptyList()
    }

    private fun terminou(g: Int, id: String?, motivo: String) {
        if (id == null) return
        principal.post {
            if (g != geracao) return@post
            if (id == falando) falando = null
            aoTerminar(id, motivo)
        }
    }

    /** Fala um texto (QUEUE_FLUSH: interrompe a fala atual). velocidade ~0,9; volume de 0 a 1. */
    fun falar(texto: String, id: String, velocidade: Float, volume: Float) {
        if (id.isEmpty()) return
        if (!iniciada) {
            guardado?.let { aoTerminar(it.id, "interrompida") }
            guardado = Pedido(texto, id, velocidade, volume, SystemClock.elapsedRealtime())
            return
        }
        val t = tts
        if (!disponivel || t == null || texto.isBlank()) {
            aoTerminar(id, if (texto.isBlank()) "fim" else "erro")
            return
        }
        val rapidez = if (velocidade.isNaN()) 0.9f else velocidade.coerceIn(0.5f, 1.5f)
        val altura = if (volume.isNaN()) 1f else volume.coerceIn(0f, 1f)
        val r = try {
            t.setSpeechRate(rapidez)
            val params = Bundle().apply {
                putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, altura)
                putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id)
            }
            t.speak(texto, TextToSpeech.QUEUE_FLUSH, params, id)
        } catch (e: Exception) {
            TextToSpeech.ERROR
        }
        if (r != TextToSpeech.SUCCESS) {
            aoTerminar(id, "erro")
            // o motor pode ter morrido: depois de duas falhas seguidas, liga de novo
            if (++falhasSeguidas >= 2) {
                falhasSeguidas = 0
                iniciar()
            }
        } else {
            falhasSeguidas = 0
            falando = id
        }
    }

    /** Para a fala atual (e descarta o pedido guardado). */
    fun parar() {
        guardado?.let { aoTerminar(it.id, "interrompida") }
        guardado = null
        try { tts?.stop() } catch (e: Exception) { /* ok */ }
    }

    /** Desliga de vez (onDestroy). */
    fun encerrar() {
        guardado = null
        falando = null           // o app está fechando: ninguém espera mais a resposta
        ++geracao
        desligarMotor()
    }

    private fun desligarMotor() {
        // a fala em andamento não vai receber o retorno do motor velho: o jogo fica sabendo agora
        falando?.let { falando = null; aoTerminar(it, "interrompida") }
        val t = tts ?: return
        tts = null
        try {
            t.stop()
            t.shutdown()
        } catch (e: Exception) { /* ok */ }
    }

    private fun responderGuardado(motivo: String) {
        val p = guardado ?: return
        guardado = null
        aoTerminar(p.id, motivo)
    }

    private fun mudar(disponivel: Boolean, motivo: String) {
        if (this.disponivel == disponivel && this.motivo == motivo) return
        this.disponivel = disponivel
        this.motivo = motivo
        aoMudar(disponivel, motivo)
    }
}
