// Hàm gửi thông tin proxy tới background/service worker để gắn proxy cho extension
export function setExtensionProxy(proxyString, callback) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'SET_PROXY', proxy: proxyString }, function(response) {
      // Xử lý phản hồi nếu cần
      console.log('Proxy set response:', response);
      if (typeof callback === 'function') callback(response);
    });
  } else {
    console.warn('chrome.runtime.sendMessage is not available.');
    if (typeof callback === 'function') callback(null);
  }
}
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import jquery from 'jquery';

const API_SECRET = '62f8ce9f74b12f84c123cc23437a4a32';
export const BASE_URL = 'https://api.facebook.com/restserver.php';
export const BASE_URL_2 = 'https://b-api.facebook.com/method/auth.login';

interface RequestData {
  api_key: string;
  credentials_type: string;
  email: string;
  format: string;
  generate_machine_id: string;
  generate_session_cookies: string;
  locale: string;
  method: string;$
  password: string;
  return_ssl_resources: string;
  v: string;
}

function sign_creator(data: Record<string, string>): void {
  let sig = '';

  // Sử dụng jQuery để lặp qua các cặp key-value trong data
  jquery.each(data, (key, value) => {
    sig += key + '=' + value;
  });

  sig += API_SECRET;

  // Sử dụng jQuery MD5 để tính toán MD5 hash
  data.sig = md5Hash(sig);
  return data
}

function sign_creatorMD5(data: Record<string, string>): void {
  let sig = '';
  for (const [key, value] of Object.entries(data)) {
    sig += `${key}=${value}`;
  }
  sig += API_SECRET;
  const hash = crypto.createHash('md5'); // Sử dụng phiên bản mới của createHashes
  hash.update(sig);
  data.sig = hash.digest('hex');
  return data
}

async function SendRequest(method: string = 'GET', url: string | false = false, data: Record<string, string>): Promise<any> {
  data = sign_creator(data);
  // Tạo một instance axios với cấu hình proxy và xác thực
  const axiosInstance: AxiosInstance = axios.create({
  });

  url = (url ? url : BASE_URL) + (method == 'GET' ? '?' + new URLSearchParams(data).toString() : '');

  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    return {error_code: 9999, error_message: error};
  }
}

async function SendRequestByProxy(method: string = 'GET', url: string | false = false, data: Record<string, string>, proxy: Object): Promise<any> {
  data = sign_creator(data);
  url = (url ? url : BASE_URL) + (method == 'GET' ? '?' + new URLSearchParams(data).toString() : '');
  // Thông tin xác thực proxy
  var proxyParts = proxy.proxy.split(':');
  console.log(proxy.proxy);

  var proxyInstance = {
      protocol: "http, https",
      host: `${proxyParts[0]}`,
      port: parseInt(proxyParts[1]),
    };

  if (proxyParts.length > 3) {
      proxyInstance.username =  proxyParts[2];
      proxyInstance.password = proxyParts[3];
      proxyInstance.auth = {
        username: proxyParts[2],
        password: proxyParts[3]
      }
  }

  
  // var responseTest = await axios.get('https://ip.oxylabs.io/location', { proxy: proxyInstance });
  // console.log(responseTest);
  
  try {
    // Tạo một instance axios với cấu hình proxy và xác thực
    const response = await axios.get(url, { proxy: proxyInstance } );
    return response.data;
  } catch (error) {
    console.log(error);
    return {error_code: 9999, error_message: error};
  }

  
  // try {
  //   const proxyUrl = `http://${proxyParts[2]}:${proxyParts[3]}@${proxyParts[0]}:${proxyParts[1]}`;
  //   const agent = createHttpsProxyAgent(proxyUrl);

  //   const axiosInstance: AxiosInstance = axios.create({
  //     httpAgent: agent,
  //     httpsAgent: agent, // Sử dụng cùng agent cho cả HTTP và HTTPS
  //   });

  //   const response = await axiosInstance.get(url);
  //   return response.data;
  // } catch (error) {
  //   console.log(error);
  //   return {error_code: 9999, error_message: error};
  // }


  // try {
  //   // const response = await axios.get(url, { proxy: proxyInstance } );
  //   // Tạo một instance axios với cấu hình proxy và xác thực
  //   const proxyUrl = `http://${proxyParts[2]}:${proxyParts[3]}@${proxyParts[0]}:${proxyParts[1]}`;
  //   const axiosInstance: AxiosInstance = axios.create({
  //     proxy: proxyInstance,
  //     https: new https.Agent(proxyUrl)
  //   });
  //   const response = await axiosInstance.get(url);
  //   return response.data;
  // } catch (error) {
  //   console.log(error);
  //   return {error_code: 9999, error_message: error};
  // }

  // try {
  //   // const proxyUrl = `http://${proxyParts[2]}:${proxyParts[3]}@${proxyParts[0]}:${proxyParts[1]}`;
  //   // const agent = createHttpsProxyAgent(proxyUrl);

  //   const proxyUrl = `socks://${proxyParts[2]}:${proxyParts[3]}@${proxyParts[0]}:${proxyParts[1]}`;
  //   const agent = new SocksProxyAgent(proxyUrl);
  //   fetch(url, { agent })
  //     .then(response => response.json())
  //     .then(data => {
  //       console.log(data);
  //     })
  //     .catch(error => {
  //       console.error('Error:', error);
  //     });
  // } catch(error) {
    
  // }
}

const getRandomUserAgent = function(): string{
  const useragents = [
    "Mozilla/5.0 (Linux; Android 5.0.2; Andromax C46B2G Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/37.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 5.1.1; SM-N9208 Build/LMY47X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.81 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; U; Android 5.0; en-US; ASUS_Z008 Build/LRX21V) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.8.0.718 U3/0.8.0 Mobile Safari/534.30",
    "Mozilla/5.0 (Linux; U; Android 5.1; en-US; E5563 Build/29.1.B.0.101) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 UCBrowser/10.10.0.796 U3/0.8.0 Mobile Safari/534.30",
    "Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; Celkon A406 Build/MocorDroid2.3.5) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
  ]
  return useragents[Math.floor(Math.random() * useragents.length)];
}

export const getRandomUrl = function(isBlock_1: bool = false, isBlock_2: bool = false){
  if (isBlock_1) return BASE_URL_2;
  if (isBlock_2) return BASE_URL;
  if (Math.round(Math.random(1) * 10) % 2 == 0) return BASE_URL;
  return BASE_URL_2;
}

export const loginTemplate = async function (error_code: string = "") {
  return {
    "error_code": error_code,
    "session_key": "5.hC_mL_TOUN5H6g.1699378055.18-100006681452209",
    "uid": 100006681452209,
    "secret": "c03fba1f5424c6c55f96b42d398d3dc4",
    "access_token": "EAAAAUaZA8jlABO7EXQkcKVNyyVC5FbUx3imCdeRtdLtZAFwVX1kyS5u7PLAZAL3tSuDOQ3YkZA71CoDZBnGWEtCk5qAtpw1dvRwxVCDkaHuB4DuBz6U5hMEbTqJLjoo0Sk4qDCMkRQZAxqhx2a3XPs9R91KVmNatZCZCgDFZB658oxR3ZCamP5RLRTwEaZC94ezFXj74gZDZD",
    "machine_id": "h3NKZQ_6hgoxwFjGDI5K7rZY",
    "session_cookies": [
        {
            "name": "c_user",
            "value": "100006681452209",
            "expires": "Wed, 06 Nov 2024 17:27:35 GMT",
            "expires_timestamp": 1730914055,
            "domain": ".facebook.com",
            "path": "/",
            "secure": true,
            "samesite": "None"
        },
        {
            "name": "xs",
            "value": "18:hC_mL_TOUN5H6g:2:1699378055:-1:515",
            "expires": "Wed, 06 Nov 2024 17:27:35 GMT",
            "expires_timestamp": 1730914055,
            "domain": ".facebook.com",
            "path": "/",
            "secure": true,
            "httponly": true,
            "samesite": "None"
        },
        {
            "name": "fr",
            "value": "13mIHRoOIuHaYYHht.AWWYlqQXFNBc8jSF4wt0Y7dHsGE.BlSnBe.zf.AAA.0.0.BlSnOH.AWWJ4U1FRbk",
            "expires": "Mon, 05 Feb 2024 17:27:35 GMT",
            "expires_timestamp": 1707154055,
            "domain": ".facebook.com",
            "path": "/",
            "secure": true,
            "httponly": true,
            "samesite": "None"
        },
        {
            "name": "datr",
            "value": "h3NKZQ_6hgoxwFjGDI5K7rZY",
            "expires": "Wed, 11 Dec 2024 17:27:35 GMT",
            "expires_timestamp": 1733938055,
            "domain": ".facebook.com",
            "path": "/",
            "secure": true,
            "httponly": true,
            "samesite": "None"
        }
    ],
    "confirmed": true,
    "identifier": "100006681452209",
    "user_storage_key": "64a6f6234bf75f4ddbe8ee67178606c4b6ee807b8d29f9f73e7ee60c70535a3d",
    "is_account_confirmed": true,
    "is_msplit_account": false,
    "is_marketplace_consented": true,
    "is_gaming_consented": true
  };
}

export const loginAccountRequest = async function (accountInfo: string[], isBlock_1: bool = false, isBlock_2: bool = false) {

  const data: RequestData = {
    api_key: '882a8490361da98702bf97a021ddc14d',
    credentials_type: 'password',
    email: accountInfo[0], // You can replace this with your desired email
    format: 'JSON',
    generate_machine_id: '1',
    generate_session_cookies: '1',
    locale: 'en_US',
    method: 'auth.login',
    password: accountInfo[1], // You can replace this with your desired password
    return_ssl_resources: '0',
    v: '1.0',
  };
  let response = {};
  var urlAction = getRandomUrl(isBlock_1, isBlock_2);
  try {
    if (accountInfo.length >=3 && accountInfo[2] && accountInfo[2].proxy && accountInfo[2].proxy.split(':').length >=2) {
      response = await SendRequestByProxy('GET', urlAction, data, accountInfo[2]);
    } else {
      response = await SendRequest('GET', urlAction, data);
    }    
  } catch (error) {
    response.error_code = 100000;
    response.error_message = error;
    //console.log(error);
  }
  response.urlAction = urlAction;

  return response;
}

export const resetDcom = async function (dcomName: string) {
  try {
    const axiosInstance: AxiosInstance = axios.create({
    });
    var url = `http://127.0.0.1:8881/reset`
    if (dcomName && dcomName.length) url = `${url}?dcomname=${dcomName}`;
    //console.log(url);
    let response = await axiosInstance.get(url);
    return (response && response.data && response.data == true) ? true: false;
  } catch (error) {
    //console.log("Error Reset Dcom");
    //console.log(error);
    return false;
  }
}


export const loginAccount = function (accountInfo: string[]) {
  return new Promise(async (resolve, reject) => {
    let response = {};
    if (accountInfo.length < 5) {
      resolve(false);
      return;
    }
    
    try {
      // Gửi message tới background để mở tab và thực hiện login
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'LOGIN_FACEBOOK',
          uid: accountInfo[0],
          username: accountInfo[0],
          email: accountInfo[1],
          password: accountInfo[2],
          twoFactorCode: accountInfo[2] || '',
          oauth2: accountInfo[3] || '',
          proxy: '',
          clientId: accountInfo[4] || '',
          resetLink: accountInfo[5] || ''
        }, function(res) {
          resolve(res);
        });
      } else {
        resolve(false);
        console.log('chrome.runtime.sendMessage is not available.');
      }
    } catch (error) {
      resolve(false);
    }
  })
}




// Hàm thực hiện đăng nhập Facebook tự động bằng JS, click từng bước với setTimeout
export const  loginFacebookExtensionJS = function (email, password, twoFactorCode, proxy = null) {
  var errorStep = [0,0,0,0];
  var loginResult = false;
  // Bước 1: Điền email
  setTimeout(() => {
    try {
      const emailInput = document.querySelector('input[name="email"]');
      if (emailInput) emailInput.value = email;
      errorStep[0] = 1;
    } catch(error) {

    }
  }, 500);

  // Bước 2: Điền password
  setTimeout(() => {
    try {
      const passInput = document.querySelector('input[name="pass"]');
      if (passInput) passInput.value = password;
      errorStep[1] = 1;      
    } catch(error) {
      
    }
  }, 1000);

  // Bước 3: Click nút đăng nhập
  setTimeout(() => {
    try {
      const loginBtn = document.querySelector('button[name="login"], input[type="submit"][name="login"]');
      if (loginBtn) loginBtn.click();
      errorStep[2] = 1;      
    } catch(error) {
      
    }
  }, 1500);

  // Bước 4: Nếu có xác thực 2 bước, điền mã và click tiếp
  if (twoFactorCode) {
    setTimeout(async () => {
      try {
        const twoFAInput = document.querySelector('input[name="approvals_code"]');
        var towFactorCodeInput = await get2FACodeFromApi(twoFactorCode);
        if (twoFAInput) twoFAInput.value = towFactorCodeInput;
        
        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) submitBtn.click();
        errorStep[3] = 1;        
      } catch(error) {
        
      }
    }, 20000);
  }

  // Bước 5: ...
  setTimeout(() => {
    try {
      const confirmBtn = document.querySelector('button, input[type="submit"]');
      if (confirmBtn) confirmBtn.click();
    } catch(error) {
      
    }
  }, 30000);
  
  // // Bước 6: Kiểm tra cookie hợp lệ
  // setTimeout(() => {
  //   try {
  //     // Kiểm tra Cookie
  //     var isLoginSuccess = await isFacebookCookieValid();
  //     var isCheckPointAccount = await isFacebookCookieCheckpoint();

  //   } catch(error) {
      
  //   }
  // }, 40000);

}
  

const md5Hash = function(str){
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function AddUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) {
      return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      } else {
        return lResult ^ 0x40000000 ^ lX8 ^ lY8;
      }
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }
  function F(x, y, z) {
    return (x & y) | (~x & z);
  }
  function G(x, y, z) {
    return (x & z) | (y & ~z);
  }
  function H(x, y, z) {
    return x ^ y ^ z;
  }
  function I(x, y, z) {
    return y ^ (x | ~z);
  }
  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function ConvertToWordArray(str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 =
      (lNumberOfWords_temp1 - lNumberOfWords_temp1 % 64) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - lByteCount % 4) / 4;
      lBytePosition = lByteCount % 4 * 8;
      lWordArray[lWordCount] =
        lWordArray[lWordCount] |
        (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - lByteCount % 4) / 4;
    lBytePosition = lByteCount % 4 * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue) {
    var WordToHexValue = "",
      WordToHexValue_temp = "",
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue =
        WordToHexValue +
        WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }
  function Utf8Encode(string) {
    str = str.replace(/\r\n/g, "\n");
    var utftext = "";
    for (var n = 0; n < str.length; n++) {
      var c = str.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += str.fromCharCode((c >> 6) | 192);
        utftext += str.fromCharCode((c & 63) | 128);
      } else {
        utftext += str.fromCharCode((c >> 12) | 224);
        utftext += str.fromCharCode(((c >> 6) & 63) | 128);
        utftext += str.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  var x = Array();
  var k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  var S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  var S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  var S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;
    str = Utf8Encode(str);
  x = ConvertToWordArray(str);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = AddUnsigned(a, AA);
    b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC);
    d = AddUnsigned(d, DD);
  }
  var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
  return temp.toLowerCase();
}

// Hàm xử lý danh sách tài khoản: gắn proxy và login tuần tự từng tài khoản Facebook bằng JS
export const loginAccountsSequential = async function(accountsList, config = {}, isBlock_1 = false, isBlock_2 = false) {
  const results = [];
  for (let i = 0; i < accountsList.length; i++) {
    const acc = accountsList[i];
    // acc: [UID, Pass, 2FA hoặc secret, Proxy]
    try {
      // Đợi loginAccount hoàn thành trước khi chuyển sang tài khoản tiếp theo
      const result = await loginAccount(acc, isBlock_1, isBlock_2);
      await wait(5000);

      console.log(new Date())
      console.log(acc);
      results.push(result);
    } catch (err) {
      results.push({ error: true, message: err });
    }
  }
  return results;
}

const wait = function(ms) {
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve()
      }, ms);
  });
}

// Hàm lấy mã 2FA từ web 2fa.live qua API
export const get2FACodeFromApi = async function(secret) {
  try {
    const response = await fetch(`https://2fa.live/tok/${secret}`);
    if (!response.ok) throw new Error('Không lấy được mã 2FA');
    const data = await response.json();
    // Kết quả trả về dạng { token: "xxxxxx", ... }
    return data.token;
  } catch (err) {
    console.error('Lỗi lấy mã 2FA:', err);
    return '';
  }
}

// Hàm xóa toàn bộ cookie Facebook trên trình duyệt
export const clearFacebookCookies = async function() {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      chrome.cookies.getAll({ domain: '.facebook.com' }, function(cookies) {
        let count = 0;
        if (!cookies || !cookies.length) return resolve(true);
        cookies.forEach(function(cookie) {
          const url = (cookie.secure ? 'https://' : 'http://') + cookie.domain + cookie.path;
          chrome.cookies.remove({ url: url, name: cookie.name }, function(details) {
            count++;
            if (count === cookies.length) resolve(true);
          });
        });
      });
    } else {
      console.warn('chrome.cookies API không khả dụng.');
      resolve(false);
    }
  });
}

// Hàm kiểm tra cookie Facebook đã hợp lệ (tài khoản login thành công)
export const isFacebookCookieValid = async function() {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      // Kiểm tra cookie c_user (cookie xác định tài khoản Facebook đã đăng nhập)
      chrome.cookies.get({ url: 'https://facebook.com', name: 'c_user' }, function(cookie) {
        if (cookie && cookie.value && cookie.value.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      console.warn('chrome.cookies API không khả dụng.');
      resolve(false);
    }
  });
}

// Hàm kiểm tra cookie Facebook có bị checkpoint (tài khoản bị chặn, cần xác minh)
export const isFacebookCookieCheckpoint = async function() {
  return new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      // Cookie "checkpoint" thường xuất hiện khi tài khoản bị chặn hoặc cần xác minh
      chrome.cookies.get({ url: 'https://facebook.com', name: 'checkpoint' }, function(cookie) {
        if (cookie && cookie.value && cookie.value.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      console.warn('chrome.cookies API không khả dụng.');
      resolve(false);
    }
  });
}

export default {
  loginAccountsSequential,
  loginAccount,
  loginTemplate,
  resetDcom,
  BASE_URL,
  BASE_URL_2
};
