package br.livia.pipocaconta

import android.content.res.AssetManager
import android.net.Uri
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.IOException

/**
 * Entrega os arquivos do jogo (assets/jogo/, copiados de ../jogo no build) no endereço
 * https://appassets.androidplatform.net/ (PROJETO.md, seção 11).
 *
 * Regras: arquivo que não existe → 404; qualquer outro endereço http(s) → 404 (nunca null, para a WebView
 * nunca tentar a rede). Só data:, blob: e about: devolvem null, porque a própria WebView resolve esses
 * endereços sem rede. A origem nunca muda entre versões: ela é a chave do localStorage (o progresso da criança).
 *
 * Roda na thread de rede da WebView (o AssetManager pode ser usado de várias threads).
 */
class ArquivosDoJogo(private val assets: AssetManager) {

    companion object {
        const val HOST = "appassets.androidplatform.net"
        const val ORIGEM = "https://$HOST"
        const val PAGINA_INICIAL = "$ORIGEM/index.html"
        const val PASTA = "jogo"
        private val CABECALHOS = mapOf(
            "Cache-Control" to "no-cache",
            "X-Content-Type-Options" to "nosniff",
        )

        /**
         * Caminho do arquivo dentro de assets/jogo/ para o caminho da URL ("/" → "index.html"), ou null se o
         * caminho tentar sair da pasta ("..", "\").
         */
        fun caminhoRelativo(caminhoUrl: String?): String? {
            var c = caminhoUrl ?: "/"
            if (c.isEmpty() || c.endsWith("/")) c += "index.html"
            val partes = c.split('/').filter { it.isNotEmpty() }
            if (partes.isEmpty() || partes.any { it == "." || it == ".." || it.contains('\\') }) return null
            return partes.joinToString("/")
        }

        private fun extensao(caminho: String) = caminho.substringAfterLast('/').substringAfterLast('.', "").lowercase()

        /** Tipo MIME pelo nome do arquivo. */
        fun tipo(caminho: String): String = when (extensao(caminho)) {
            "html", "htm" -> "text/html"
            "js", "mjs" -> "text/javascript"
            "css" -> "text/css"
            "json" -> "application/json"
            "txt" -> "text/plain"
            "svg" -> "image/svg+xml"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "webp" -> "image/webp"
            "gif" -> "image/gif"
            "ico" -> "image/x-icon"
            "woff2" -> "font/woff2"
            "woff" -> "font/woff"
            "ttf" -> "font/ttf"
            "otf" -> "font/otf"
            "mp3" -> "audio/mpeg"
            "ogg" -> "audio/ogg"
            "wav" -> "audio/wav"
            else -> "application/octet-stream"
        }

        /** Codificação dos arquivos de texto (null para os binários). */
        fun codificacao(caminho: String): String? = when (extensao(caminho)) {
            "html", "htm", "js", "mjs", "css", "json", "txt", "svg" -> "utf-8"
            else -> null
        }
    }

    /** Resposta para um pedido da WebView. */
    fun responder(url: Uri): WebResourceResponse? {
        val esquema = url.scheme?.lowercase()
        if (esquema == "data" || esquema == "blob" || esquema == "about") return null
        if (esquema != "https" || !HOST.equals(url.host, ignoreCase = true)) return naoEncontrado()
        val relativo = caminhoRelativo(url.path) ?: return naoEncontrado()
        return try {
            val entrada = assets.open("$PASTA/$relativo", AssetManager.ACCESS_STREAMING)
            WebResourceResponse(tipo(relativo), codificacao(relativo), 200, "OK", CABECALHOS, entrada)
        } catch (e: IOException) {
            naoEncontrado()
        }
    }

    private fun naoEncontrado() =
        WebResourceResponse("text/plain", "utf-8", 404, "Not Found", CABECALHOS, ByteArrayInputStream(ByteArray(0)))
}
