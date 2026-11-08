# Pipoca Aprende — regras do R8 para a versão de release.
# A ponte com o jogo usa WebViewCompat.addWebMessageListener (uma interface comum, sem @JavascriptInterface),
# e a biblioteca de cobrança traz as próprias regras. Por isso não há nada extra para manter aqui.

# Mantém números de linha nos relatórios de erro (o mapeamento fica em app/build/outputs/mapping/release/).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
