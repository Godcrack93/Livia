// Pipoca Conta — módulo do app (PROJETO.md, seções 8, 10 e 11).
import java.security.MessageDigest
import java.util.Properties
import javax.inject.Inject
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/** Lê um arquivo .properties em UTF-8. Arquivo ausente = vazio. */
fun lerPropriedades(arquivo: File): Properties {
    val p = Properties()
    if (arquivo.isFile) arquivo.reader(Charsets.UTF_8).use { p.load(it) }
    return p
}

/** Texto pronto para virar um campo String do BuildConfig (com aspas e escapes). */
fun textoJava(valor: String): String = "\"" + valor.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

// aplicativo/revisao.properties (fora do git; modelo em revisao.properties.example):
//   CODIGO_REVISAO   código de acesso para a equipe de revisão do Google Play (libera tudo por 30 dias)
//   PRIVACIDADE_URL  endereço público (https) da política de privacidade
val revisao = lerPropriedades(rootProject.file("revisao.properties"))
val codigoRevisao: String = revisao.getProperty("CODIGO_REVISAO", "").trim()
val privacidadeUrl: String = revisao.getProperty("PRIVACIDADE_URL", "").trim().let { url ->
    if (url.isEmpty() || url.startsWith("https://")) url
    else {
        logger.warn("revisao.properties: PRIVACIDADE_URL precisa começar com https:// — ignorada.")
        ""
    }
}

/**
 * O app guarda só o resumo SHA-256 do código de revisão, nunca o código em si.
 * Mesmo cálculo de RegrasAssinatura.resumoDoCodigo() (prefixo do pacote + código em maiúsculas).
 */
fun resumoDoCodigo(codigo: String): String {
    if (codigo.isEmpty()) return ""
    val bytes = MessageDigest.getInstance("SHA-256")
        .digest(("br.livia.pipocaconta:" + codigo.uppercase()).toByteArray(Charsets.UTF_8))
    return bytes.joinToString("") { "%02x".format(it) }
}

// aplicativo/keystore.properties (fora do git; modelo em keystore.properties.example): chave de upload da Play.
val chaveUpload = lerPropriedades(rootProject.file("keystore.properties"))
val temChaveUpload = chaveUpload.getProperty("storeFile", "").isNotBlank()

android {
    namespace = "br.livia.pipocaconta"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        // Confirmar antes do primeiro envio à Play: depois de publicado, o pacote não muda nunca.
        applicationId = "br.livia.pipocaconta"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "CODIGO_REVISAO_SHA256", textoJava(resumoDoCodigo(codigoRevisao)))
        buildConfigField("String", "PRIVACIDADE_URL", textoJava(privacidadeUrl))
    }

    signingConfigs {
        if (temChaveUpload) {
            create("upload") {
                storeFile = rootProject.file(chaveUpload.getProperty("storeFile").trim())
                storePassword = chaveUpload.getProperty("storePassword", "")
                keyAlias = chaveUpload.getProperty("keyAlias", "")
                keyPassword = chaveUpload.getProperty("keyPassword", "")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            // Sem keystore.properties o AAB/APK de release sai sem assinatura (a Play recusa): veja o README.
            signingConfig = signingConfigs.findByName("upload")
        }
    }

    // Só o JDK 21 está instalado: código Java 17, sem toolchains do Gradle.
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = true
    }

    androidResources {
        // As fontes .woff2 e as falas .mp3 já são comprimidas: ficam guardadas sem compressão no APK.
        noCompress += listOf("woff2", "mp3")
        // O jogo é só em português: as traduções das bibliotecas para outras línguas ficam fora do APK.
        localeFilters += listOf("pt", "pt-rBR")
    }

    lint {
        // As versões são fixadas pelo PROJETO.md (seção 11): sem avisos de "existe versão mais nova".
        // O código usa só a API da plataforma e do androidx.core, sem as extensões -ktx.
        disable += setOf("OldTargetApi", "GradleDependency", "AndroidGradlePluginVersion", "UseKtx", "KtxExtensionAvailable")
    }

    testOptions {
        // Testes do PC (src/test): Log, Uri etc. do Android devolvem valores vazios em vez de falhar;
        // o org.json de verdade vem da dependência de teste abaixo.
        unitTests.isReturnDefaultValues = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.android.billingclient:billing:9.1.0")
    implementation("androidx.activity:activity:1.13.0")
    // O PROJETO.md fala em core 1.17.x, mas a activity 1.13.0 exige a 1.18.0 (o Gradle subiria sozinho):
    // fica declarada a versão que vai de fato no APK. Ela funciona com compileSdk 36.
    implementation("androidx.core:core:1.18.0")
    implementation("androidx.webkit:webkit:1.18.0")
    testImplementation("junit:junit:4.13.2")
    // No PC, o org.json do android.jar é só "casca": os testes da ponte usam a implementação de verdade.
    testImplementation("org.json:json:20250517")
}

// ------------------------------------------------------------------------------------------------
// O jogo (../jogo, SEM a pasta teste/) entra no APK em assets/jogo/ por uma cópia feita no build.
// Nada é duplicado no repositório: a cópia fica em app/build/ (fora do git).

/** Copia a pasta do jogo para os assets gerados de uma variante (debug/release). */
abstract class CopiarJogo : DefaultTask() {
    companion object {
        /** O que nunca vai para o APK: os testes do navegador e lixo de editores e do sistema. */
        val FORA_DO_APK = listOf("teste/**", "**/.*", "**/Thumbs.db", "**/desktop.ini", "**/*.bak", "**/*~")
    }

    /** Pasta jogo/ (raiz do jogo web). */
    @get:Internal
    abstract val pasta: DirectoryProperty

    /** Arquivos que vão para o APK (tudo menos teste/): são eles que decidem se a cópia precisa rodar de novo. */
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    val arquivosDoJogo: FileTree
        get() = pasta.asFileTree.matching { exclude(FORA_DO_APK) }

    /** Pasta de assets gerada (o AGP escolhe o lugar dentro de app/build/). */
    @get:OutputDirectory
    abstract val saida: DirectoryProperty

    @get:Inject
    abstract val arquivos: FileSystemOperations

    @TaskAction
    fun copiar() {
        val origem = pasta.get().asFile
        if (!origem.resolve("index.html").isFile) throw GradleException("Não achei o jogo em $origem (falta index.html).")
        arquivos.sync {
            from(origem) { exclude(FORA_DO_APK) }
            into(saida.get().asFile.resolve("jogo"))
        }
    }
}

androidComponents {
    onVariants { variante ->
        val nome = variante.name.replaceFirstChar { it.uppercase() }
        val copiar = tasks.register<CopiarJogo>("copiarJogo$nome") {
            description = "Copia ../jogo (sem teste/) para os assets do APK."
            pasta.set(rootProject.file("../jogo"))
        }
        variante.sources.assets?.addGeneratedSourceDirectory(copiar, CopiarJogo::saida)
    }
}

// Avisos para quem gera a versão da loja.
gradle.taskGraph.whenReady {
    val loja = allTasks.any { it.project == project && it.name.contains("Release") && (it.name.startsWith("bundle") || it.name.startsWith("assemble")) }
    if (loja) {
        if (!temChaveUpload) logger.warn("AVISO: sem aplicativo/keystore.properties — o pacote de release sai SEM assinatura.")
        if (codigoRevisao.isEmpty()) logger.warn("AVISO: sem CODIGO_REVISAO em aplicativo/revisao.properties — o acesso de revisão fica desligado.")
        if (privacidadeUrl.isEmpty()) logger.warn("AVISO: sem PRIVACIDADE_URL em aplicativo/revisao.properties — o botão da política não abre nada.")
    }
}
