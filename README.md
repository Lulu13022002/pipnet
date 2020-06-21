# pipnet
A large api about web
Usable with php (you're free to convert php code to you're back end code and submit a PR)

## Levels inside a unique method
When you use method by its name you use the highest level of this method. But if you want to use a lower level of this method mainly for performance add underscore before method's name. For example:

emultiple -> _emultiple -> __emultiple  -> ____emultiple
                        -> ___emultiple
highest         -1             -2              lowest

Sometimes like emultiple it can exist two low methods at the same level or another transformation, in this case refer you to the documentation or comments before method. It can also exist sub methods to a unique method for complex method.
emultiple also use bigmultiple (biginteger/bigdecimal) and shortmultiple (shortdecimal).

## Security information
Security method (TLS/SSL) is based on userAgent. But userAgent can be spoofed (there are other check for example to check if it's googleBot we check IP and not just userAgent). User that spoofed their userAgent can get bad result for TLS/SSL detection (and other infos: computer processor, version, type...) but in most cases you want show this information to user so it's not a problem, it's like you start a program but you're firewall block app.

But to check TLS/SSL support on a website, the userAgent is unsuitable but you can follow method described below that provide a more robust check:
Choose a folder named security

<details>
  <summary>on Apache server</summary>
   in ssl.conf on security folder with http2_module and mod_ssl enabled:

   ```conf
   # if ssl.conf isn't located inside security folder you can use Location scope
   <VirtualHost *:443>
      ServerName www.example.com
      
      <IfModule http2_module>
         Protocols h2 http/1.1
      </IfModule>
      <IfModule ssl_module>
         SSLEngine on
         SSLCertificateFile "/path/to/www.example.com.cert" # use openssl to generate cert / key files
         SSLCertificateKeyFile "/path/to/www.example.com.key"
         
         SSLUseStapling On # enable better method of listening status certificate
         SSLStaplingCache "shmcb:ssl_stapling(32768)"
      </IfModule>
      #<Location "/security">
         <IfModule ssl_module>
            SSLProtocol all -SSLv2 -SSLv3 -TLSv1 -TLSv1.1 # version that isn't supported (all without the version that you check: here it's TLS 1.2)
            SSLCipherSuite HIGH:!aNULL:!MD5:!3DES # high cipher
            #SSLCipherSuite RC4-SHA:AES128-SHA:HIGH:!aNULL:!MD5 high cipher algorithm optimized speed (choosed by mod_ssl)
            SSLHonorCipherOrder on # disable client preference (avoid spoofed result)
         </IfModule>
      #</Location>
   </VirtualHost>
   ```
   See: https://httpd.apache.org/docs/trunk/fr/ssl/ssl_howto.html
   Reload Apache
</details>
<details>
  <summary>on Nginx server</summary>
   in nginx.conf or virtual domain config file with ngx_http_ssl_module enabled

   ```conf
   #http {
      server {
         listen 443;
         server_name www.example.com;
         ssl on;
         ssl_certificate /etc/nginx/ssl/server.crt;
         ssl_certificate_key     /etc/nginx/ssl/server.key;

         ssl_stapling on; # enable better method of listening status certificate
         ssl_stapling_verify on;

         # if config file isn't located inside security folder you can use location scope
         #location /security {
            ssl_protocols TLSv1.2;
            ssl_prefer_server_ciphers on; # disable client preference
         #}
      }
   #}
   ```
   Check nginx config error with command: `nginx -t`
   See: https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_protocols
   Reload Nginx
</details>
<details>
   <summary>generate certificate files with OpenSSL</summary>
   in terminal:
   - openssl genrsa -des3 -out server.key 2048
   - openssl req -new -key server.key -out server.csr
   (optional) - openssl req -noout -text -in server.csr // check accurate info
   if when you reload server (Nginx or Apache) he cannot reads these file type to disable password:
   (unrecommended) - openssl rsa -in server.key -out server.unsafe.key
</details>

### Javascript implementation
add an image test.png in this folder (a small file to load it faster)
then you can simply create a request and see if the image loads without error:

```Javascript
var img = document.createElement('img');
img.style.display = "none";
img.addEventListener('load', function() {
   // TLS 1.2 supported for browser AND website
}, false);
img.addEventListener('error', function() {
   // TLS 1.2 not supported for browser AND website
}, false);
img.src = "folder/test.png";
document.body.appendChild(img);
```
Make sure to define right permissions on folder that contains images.
The advantage of this method over userAgent: cannot be spoofed and if user loads image successfully
you're sure that he uses a browser that support SSL/TLS version with website support. So if you choose this method you can delete TLS and SSL method cause you don't need it.

You're free to use CSS or arrow function if you want.
To get PHP version or OpenSSL we use header information or when it's unavailable (only in full version) the $_SERVER variable but these values can be also spoofed. 

## Math warning
Event with exact method some round / truncate method operate by machine can be important depending on your equipment. Some methods have some variables that indicate this error: T (approximation), Tr(T round), Tt(T truncate), Tm (T max = (Tr + Tt + T) only if these variables are available). Methods dL2/3 of derivation package simulate a limitation to zero with f'(x) = (f(x + h) - f(x - h)) / 2h. It's apply also for calculation of integral were sometimes the maxima error are calculated but don't take in count exact method. But you're free to implement your own calculation of integral with exact method with these methods:

   x+y: `__eadd([x, y], 2);`
   x-y: `__esubstract([x, y], 2);`
   x*y: `__emultiple([x, y], 2);`
   x/y: `__edivide([x, y], 2);`
   x%y: `__nemodulo([x, y], 2);`

These methods support shortdecimal, longdecimal, biginteger and bigdecimal.
Warning: __emodulo try to repair bad result of % but if % have other problems. It's more safer of use __nemodulo that depends of __emultiple and implicitly of multiplication but it's also slower. So if __emodulo work with your constants use it otherwise use __nemodulo

Note: these methods try to eliminate approximative result evaluated by JS engine (browser) but not machine approximation)
In general way avoid to use complex calculation method in order to have a global constant result between all users.
Also method round, floor, ceil, trunc use bit operator when it's possible and pow10 optimize pow(x, 10)
use pow10 when you know that exponent are 10 otherwise use pow that check for possible pow10 usage

## Deprecated browser behaviour
All method use jsapi branch that support (in future) all JS method that don't control browser.
But some method like secure PRNG depends on a method (here: window.crypto) that jsapi cannot simulate so if you use a such method you can have a warning in this case you can use a simple condition:
if(method is available) // execute secure PRNG
else // execute your secure PRNG
Also note that a native method of js can be implemented differently depending on browser (it's also why jsapi exists).

## Branches
- master: in development may be unstable
- java-type: patch to add java type and all method translated from java (int, long, bigint, bigdecimal...)
- math: things about math (PRNG, sin, cos, exact methods, function, integral, derivation, limit...)
- math-eval-string: custom eval method that replaces eval for usage related at math
- jsapi: include all methods provided by js (by browser), these new methods can have an improved version. In the future this branch will have its own repository

## Sources
...

## Licenses
<details>
  <summary>MersenneTwister PRNG</summary>
    A C-program for MT19937, with initialization improved 2002/2/10.
    Coded by Takuji Nishimura and Makoto Matsumoto.
    This is a faster version by taking Shawn Cokus's optimization,
    Matthe Bellew's simplification, Isaku Wada's real version.

    Before using, initialize the state by using init_genrand(seed) 
    or init_by_array(init_key, key_length).

    Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
    All rights reserved.                          

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

     1. Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.

     2. Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

     3. The names of its contributors may not be used to endorse or promote 
        products derived from this software without specific prior written 
        permission.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
   CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
   EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
   PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
   PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
   LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
   NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


   Any feedback is very welcome.
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
   email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
</details>