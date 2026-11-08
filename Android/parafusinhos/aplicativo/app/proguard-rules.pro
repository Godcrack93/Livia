# A ponte com o JavaScript (window.ParafusinhosAndroid) é achada por reflexão:
# mantém os métodos anotados com @JavascriptInterface e a própria anotação,
# que o WebView confere em tempo de execução.
-keepattributes RuntimeVisibleAnnotations
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
