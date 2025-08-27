// Hàm kiểm tra trạng thái đăng nhập Facebook thông qua cookie (Tối ưu tốc độ)
function checkLoginResult(tabId, email, sendResponse) {
  console.log('🔍 Bắt đầu kiểm tra trạng thái đăng nhập...');
  
  // Sử dụng Promise.all để chạy song song việc lấy tab info và cookie
  const getTabInfo = new Promise((resolve) => {
    chrome.tabs.get(tabId, function(tab) {
      if (chrome.runtime.lastError) {
        console.warn('⚠️ Không thể lấy thông tin tab:', chrome.runtime.lastError.message);
        resolve({ url: '', hasCheckpoint: false });
        return;
      }
      
      const tabUrl = tab ? tab.url : '';
      const hasCheckpointInUrl = tabUrl.includes('/checkpoint/') || tabUrl.includes('checkpoint');
      
      if (hasCheckpointInUrl) {
        console.log(`⚠️ Phát hiện checkpoint trong URL: ${tabUrl}`);
      }
      
      resolve({ url: tabUrl, hasCheckpoint: hasCheckpointInUrl });
    });
  });
  
  const getCookieInfo = new Promise((resolve) => {
    chrome.cookies.getAll({ domain: '.facebook.com' }, function(cookies) {
      console.log(`🍪 Tìm thấy ${cookies.length} cookie Facebook`);
      
      // Tối ưu: Chỉ tìm các cookie cần thiết trong một lần duyệt
      const cookieMap = {
        c_user: null,
        xs: null,
        checkpoint: null,
        fr: null,
        datr: null,
        sb: null
      };
      
      // Duyệt một lần qua tất cả cookie
      for (const cookie of cookies) {
        if (cookieMap.hasOwnProperty(cookie.name)) {
          cookieMap[cookie.name] = cookie;
        }
      }
      
      resolve({ cookieMap, totalCookies: cookies.length });
    });
  });
  
  // Chạy song song và xử lý kết quả
  Promise.all([getTabInfo, getCookieInfo])
    .then(([tabInfo, cookieInfo]) => {
      const { url: tabUrl, hasCheckpoint: hasCheckpointInUrl } = tabInfo;
      const { cookieMap, totalCookies } = cookieInfo;
      
      // Destructure cookie map
      const { c_user, xs, checkpoint, fr, datr, sb } = cookieMap;
      
      let loginStatus = {
        success: false,
        isLoginSuccess: false,
        isCheckPointAccount: false,
        message: '',
        email: email,
        tabId: tabId,
        timestamp: new Date().toISOString(),
        cookies: {
          c_user: c_user ? c_user.value : null,
          xs: xs ? xs.value : null,
          checkpoint: checkpoint ? checkpoint.value : null,
          fr: fr ? fr.value : null,
          datr: datr ? datr.value : null,
          sb: sb ? sb.value : null,
          total: totalCookies
        },
        url: tabUrl
      };
      
      // Phân tích trạng thái dựa vào cookie và URL
      if (c_user && c_user.value && c_user.value.length > 0) {
        console.log(`👤 User ID từ cookie: ${c_user.value}`);
        
        // Kiểm tra checkpoint qua cookie HOẶC URL
        if ((checkpoint && checkpoint.value) || hasCheckpointInUrl) {
          loginStatus.isCheckPointAccount = true;
          loginStatus.success = true;
          
          if (hasCheckpointInUrl && checkpoint && checkpoint.value) {
            loginStatus.message = `Tài khoản bị checkpoint (URL + cookie) - User ID: ${c_user.value}`;
            console.log('⚠️ Checkpoint detected qua cả URL và cookie');
          } else if (hasCheckpointInUrl) {
            loginStatus.message = `Tài khoản bị checkpoint (URL) - User ID: ${c_user.value}`;
            console.log('⚠️ Checkpoint detected qua URL');
          } else {
            loginStatus.message = `Tài khoản bị checkpoint (cookie) - User ID: ${c_user.value}`;
            console.log('⚠️ Checkpoint detected qua cookie');
          }
        } else if (xs && xs.value && fr && fr.value) {
          loginStatus.isLoginSuccess = true;
          loginStatus.success = true;
          loginStatus.message = `Đăng nhập thành công hoàn toàn (User ID: ${c_user.value})`;
          console.log('✅ Đăng nhập thành công với đầy đủ session cookie');
        } else {
          loginStatus.isLoginSuccess = true;
          loginStatus.success = true;
          loginStatus.message = `Đăng nhập thành công nhưng session chưa hoàn chỉnh (User ID: ${c_user.value})`;
          console.log('⚠️ Đăng nhập thành công nhưng session chưa đầy đủ');
        }
      } else {
        loginStatus.success = true;
        loginStatus.isLoginSuccess = false;
        loginStatus.isCheckPointAccount = false;
        
        if (totalCookies > 0) {
          loginStatus.message = `Đăng nhập thất bại - Có ${totalCookies} cookie nhưng không có session hợp lệ`;
          console.log('❌ Đăng nhập thất bại - Không có cookie c_user');
        } else {
          loginStatus.message = 'Đăng nhập thất bại - Không có cookie Facebook nào';
          console.log('❌ Đăng nhập thất bại - Không có cookie nào');
        }
      }
      
      console.log('📊 Kết quả kiểm tra chi tiết:', loginStatus);
      
      // Trả kết quả ngay lập tức
      if (sendResponse) {
        sendResponse(loginStatus);
      }
      
      // Nếu đăng nhập thành công, thực hiện cleanup với delay ngắn hơn
      if (loginStatus.isLoginSuccess) {
        console.log('🧹 Đăng nhập thành công, bắt đầu cleanup...');
        
        // Giảm delay để tăng tốc độ
        setTimeout(() => {
          // Chạy song song clear cookie và đóng tab để tăng tốc
          Promise.all([
            clearFacebookCookies(),
            new Promise(resolve => setTimeout(resolve, 500)) // Delay nhỏ trước khi đóng tab
          ]).then(([cookieResult]) => {
            console.log('✅ Đã clear cookie Facebook');
            
            return closeFacebookTabs();
          }).then(() => {
            console.log('🎉 Cleanup hoàn tất - Đã đóng tất cả tab Facebook');
          }).catch((error) => {
            console.error('❌ Lỗi trong quá trình cleanup:', error);
          });
        }, 1000); // Giảm từ 2000ms xuống 1000ms
      }
      
      return loginStatus;
    })
    .catch((error) => {
      console.error('❌ Lỗi khi kiểm tra trạng thái login:', error);
      
      const errorStatus = {
        success: false,
        isLoginSuccess: false,
        isCheckPointAccount: false,
        message: `Lỗi kiểm tra login: ${error.message}`,
        email: email,
        tabId: tabId,
        timestamp: new Date().toISOString(),
        error: error.message
      };
      
      if (sendResponse) {
        sendResponse(errorStatus);
      }
      
      return errorStatus;
    });
}

// Hàm đóng tất cả tab Facebook (Tối ưu tốc độ)
function closeFacebookTabs() {
  return new Promise((resolve) => {
    console.log('🔍 Bắt đầu tìm kiếm tab Facebook...');
    
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Lỗi khi query tabs:', chrome.runtime.lastError);
        resolve(false);
        return;
      }
      
      const facebookTabs = tabs.filter(tab => 
        tab.url && (
          tab.url.includes('facebook.com') ||
          tab.url.includes('m.facebook.com') ||
          tab.url.includes('web.facebook.com') ||
          tab.url.includes('fb.com')
        )
      );
      
      console.log(`🔍 Tìm thấy ${facebookTabs.length} tab Facebook đang mở`);
      
      if (facebookTabs.length === 0) {
        console.log('✅ Không có tab Facebook nào để đóng');
        resolve(true);
        return;
      }
      
      // Tối ưu: Đóng tất cả tab song song thay vì tuần tự
      const tabIds = facebookTabs.map(tab => tab.id);
      console.log(`🎯 Sẽ đóng các tab ID: ${tabIds.join(', ')}`);
      
      let closedCount = 0;
      let totalTabs = tabIds.length;
      
      // Đóng tất cả tab song song để tăng tốc độ
      tabIds.forEach(tabId => {
        chrome.tabs.remove(tabId, () => {
          if (chrome.runtime.lastError) {
            console.warn(`⚠️ Không thể đóng tab ${tabId}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`❌ Đã đóng tab Facebook ID: ${tabId}`);
          }
          
          closedCount++;
          if (closedCount === totalTabs) {
            console.log(`✅ Đã đóng ${closedCount}/${totalTabs} tab Facebook`);
            resolve(true);
          }
        });
      });
      
      // Timeout fallback sau 5 giây
      setTimeout(() => {
        if (closedCount < totalTabs) {
          console.warn(`⚠️ Timeout: Đã đóng ${closedCount}/${totalTabs} tab`);
          resolve(true);
        }
      }, 5000);
    });
  });
}

// Hàm clear cookie Facebook (Tối ưu tốc độ)
function clearFacebookCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: '.facebook.com' }, (cookies) => {
      if (cookies.length === 0) {
        console.log('✅ Không có cookie Facebook nào để xóa');
        resolve(true);
        return;
      }
      
      console.log(`🍪 Sẽ xóa ${cookies.length} cookie Facebook`);
      
      let removedCount = 0;
      let totalCookies = cookies.length;
      
      // Tối ưu: Xóa tất cả cookie song song thay vì tuần tự
      cookies.forEach(cookie => {
        const url = (cookie.secure ? 'https://' : 'http://') + cookie.domain + cookie.path;
        chrome.cookies.remove({ url: url, name: cookie.name }, () => {
          if (chrome.runtime.lastError) {
            console.warn(`⚠️ Không thể xóa cookie ${cookie.name}:`, chrome.runtime.lastError.message);
          } else {
            console.log(`🗑️ Đã xóa cookie: ${cookie.name}`);
          }
          
          removedCount++;
          if (removedCount === totalCookies) {
            console.log(`✅ Đã xóa ${removedCount}/${totalCookies} cookie Facebook`);
            resolve(true);
          }
        });
      });
      
      // Timeout fallback sau 10 giây
      setTimeout(() => {
        if (removedCount < totalCookies) {
          console.warn(`⚠️ Timeout: Đã xóa ${removedCount}/${totalCookies} cookie`);
          resolve(true);
        }
      }, 10000);
    });
  });
}

// Hàm kiểm tra cookie captcha từ Google/Facebook
function checkGoogleCaptchaCookies() {
  return new Promise((resolve) => {
    console.log('🔍 Kiểm tra cookie captcha từ Google và Facebook...');
    
    // Kiểm tra song song các domain khác nhau
    const domainChecks = [
      // Kiểm tra cookie Facebook
      new Promise((resolveFb) => {
        chrome.cookies.getAll({ domain: '.facebook.com' }, function(cookies) {
          const captchaCookies = cookies.filter(cookie => 
            cookie.name.includes('captcha') ||
            cookie.name.includes('challenge') ||
            cookie.name.includes('verification') ||
            cookie.name.includes('security_check') ||
            cookie.name.includes('checkpoint') ||
            cookie.name.includes('flow_state')
          );
          resolveFb({ domain: '.facebook.com', cookies: captchaCookies, total: cookies.length });
        });
      }),
      
      // Kiểm tra cookie _GRECAPTCHA từ www.fbsbx.com
      new Promise((resolveFbsbx) => {
        chrome.cookies.getAll({ domain: '.fbsbx.com' }, function(cookies) {
          const grecaptchaCookies = cookies.filter(cookie => 
            cookie.name === '_GRECAPTCHA' ||
            cookie.name.includes('captcha') ||
            cookie.name.includes('recaptcha')
          );
          resolveFbsbx({ domain: '.fbsbx.com', cookies: grecaptchaCookies, total: cookies.length });
        });
      }),
      
      // Kiểm tra cookie Google reCAPTCHA
      new Promise((resolveGoogle) => {
        chrome.cookies.getAll({ domain: '.google.com' }, function(cookies) {
          const googleCaptchaCookies = cookies.filter(cookie => 
            cookie.name.includes('_GRECAPTCHA') ||
            cookie.name.includes('recaptcha') ||
            cookie.name.includes('captcha')
          );
          resolveGoogle({ domain: '.google.com', cookies: googleCaptchaCookies, total: cookies.length });
        });
      })
    ];
    
    Promise.all(domainChecks).then((results) => {
      const [fbResult, fbsbxResult, googleResult] = results;
      
      console.log(`🍪 Facebook domain: ${fbResult.total} cookie, ${fbResult.cookies.length} captcha-related`);
      console.log(`🍪 Fbsbx domain: ${fbsbxResult.total} cookie, ${fbsbxResult.cookies.length} captcha-related`);
      console.log(`🍪 Google domain: ${googleResult.total} cookie, ${googleResult.cookies.length} captcha-related`);
      
      // Gộp tất cả cookie captcha từ các domain
      const allCaptchaCookies = [...fbResult.cookies, ...fbsbxResult.cookies, ...googleResult.cookies];
      const hasCaptcha = allCaptchaCookies.length > 0;
      
      if (hasCaptcha) {
        console.log('⚠️ Phát hiện cookie captcha/challenge:');
        allCaptchaCookies.forEach(cookie => {
          const domain = cookie.domain || 'unknown';
          console.log(`   📋 ${domain} - ${cookie.name}: ${cookie.value.substring(0, 30)}...`);
        });
      } else {
        console.log('✅ Không có cookie captcha/challenge từ tất cả domain');
      }
      
      resolve({
        hasCaptcha: hasCaptcha,
        captchaCookies: allCaptchaCookies,
        domainResults: results,
        totalCookies: fbResult.total + fbsbxResult.total + googleResult.total
      });
    }).catch((error) => {
      console.error('❌ Lỗi khi kiểm tra cookie captcha:', error);
      resolve({
        hasCaptcha: false,
        captchaCookies: [],
        error: error.message,
        totalCookies: 0
      });
    });
  });
}

// Thêm message listener để test đóng tab Facebook
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLOSE_FACEBOOK_TABS') {
    console.log('🎯 Nhận yêu cầu đóng tab Facebook...');
    closeFacebookTabs().then((result) => {
      sendResponse({ 
        success: result, 
        message: result ? 'Đã đóng tất cả tab Facebook' : 'Có lỗi khi đóng tab Facebook' 
      });
    }).catch((error) => {
      console.error('❌ Lỗi khi đóng tab Facebook:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Giữ message channel mở cho async response
  }
  
  if (message.type === 'CLEAR_FACEBOOK_COOKIES') {
    console.log('🍪 Nhận yêu cầu clear cookie Facebook...');
    clearFacebookCookies().then((result) => {
      sendResponse({ 
        success: result, 
        message: result ? 'Đã xóa tất cả cookie Facebook' : 'Có lỗi khi xóa cookie Facebook' 
      });
    }).catch((error) => {
      console.error('❌ Lỗi khi clear cookie Facebook:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Giữ message channel mở cho async response
  }
  
  if (message.type === 'CLEANUP_BEFORE_LOGIN') {
    console.log('🧹 Nhận yêu cầu cleanup trước khi login...');
    
    // Đóng tab trước
    closeFacebookTabs().then((tabResult) => {
      console.log(`📋 Kết quả đóng tab: ${tabResult}`);
      
      // Sau đó clear cookie
      return clearFacebookCookies();
    }).then((cookieResult) => {
      console.log(`🍪 Kết quả clear cookie: ${cookieResult}`);
      
      sendResponse({ 
        success: true, 
        message: 'Cleanup hoàn tất - Đã đóng tab và clear cookie Facebook',
        details: {
          tabsClosed: true,
          cookiesCleared: cookieResult
        }
      });
    }).catch((error) => {
      console.error('❌ Lỗi khi cleanup:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Giữ message channel mở cho async response
  }
  
  if (message.type === 'CHECK_GOOGLE_CAPTCHA_COOKIES') {
    console.log('🔍 Nhận yêu cầu kiểm tra cookie captcha từ Google/Facebook...');
    checkGoogleCaptchaCookies().then((result) => {
      sendResponse({ 
        success: true, 
        message: result.hasCaptcha ? 
          `⚠️ Phát hiện ${result.captchaCookies.length} cookie captcha` : 
          '✅ Không có cookie captcha',
        data: result
      });
    }).catch((error) => {
      console.error('❌ Lỗi khi kiểm tra captcha:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true; // Giữ message channel mở cho async response
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
  
  // Xử lý setup proxy
  if (message.type === 'SET_PROXY') {
    const proxyInfo = message.proxy.split(':');
    if (proxyInfo.length >= 2) {
      const proxyConfig = {
        mode: "fixed_servers",
        rules: {
          singleProxy: {
            scheme: "http",
            host: proxyInfo[0],
            port: parseInt(proxyInfo[1])
          }
        }
      };
      
      // Nếu có username và password cho proxy
      if (proxyInfo.length >= 4) {
        proxyConfig.rules.singleProxy.scheme = "http";
        // Chrome extension không hỗ trợ trực tiếp auth proxy trong config
        // Sẽ cần xử lý qua webRequest API cho auth
      }
      
      chrome.proxy.settings.set({
        value: proxyConfig,
        scope: 'regular'
      }, function() {
        if (chrome.runtime.lastError) {
          console.error('Lỗi setup proxy:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Proxy đã được setup thành công:', message.proxy);
          sendResponse({ success: true, proxy: message.proxy });
        }
      });
    } else {
      sendResponse({ success: false, error: 'Proxy format không hợp lệ' });
    }
    return true; // Giữ message channel mở cho sendResponse async
  }
  
  // Xử lý set 2FA code
  if (message.type === 'SET_2FA_CODE') {
    const twoFAInput = document.evaluate("//form[contains(@method, 'GET')]//div//div//div//input[contains(@type, 'text')]",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (twoFAInput) twoFAInput.value = message.token;
    const submitBtn = document.evaluate("//div//div//div//div//div[contains(@role,'none')]//div[contains(@role,'none')]/..",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (submitBtn) setTimeout(() => {
       submitBtn.click();
    }, 1500);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false });
  }
  
  // Xử lý captcha detection sau login
  if (message.type === 'CAPTCHA_DETECTED_AFTER_LOGIN') {
    console.log(`🛑 CAPTCHA DETECTED sau login cho email: ${message.email}`);
    console.log(`📍 Captcha Type: ${message.captchaType}`);
    console.log(`🔗 URL: ${message.url}`);
    console.log(`⏰ Timestamp: ${message.timestamp}`);
    console.log('⚠️ Sẽ tăng thời gian chờ thêm 40 giây để người dùng giải captcha...');
    
    sendResponse({ 
      success: true, 
      message: 'Đã phát hiện captcha sau login',
      needsExtraWait: true,
      extraWaitTime: 40000
    });
  }
  
  if (message.type === 'NO_CAPTCHA_AFTER_LOGIN') {
    console.log(`✅ KHÔNG có captcha sau login cho email: ${message.email}`);
    console.log(`🔗 URL: ${message.url}`);
    console.log('🚀 Có thể tiếp tục quá trình login bình thường');
    
    sendResponse({ 
      success: true, 
      message: 'Không có captcha sau login',
      needsExtraWait: false
    });
  }
});

// Xử lý kiểm tra trạng thái đăng nhập
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_LOGIN_STATUS') {
    const { email, tabId } = message;
    console.log(`🔍 Yêu cầu kiểm tra trạng thái login cho: ${email}`);
    
    checkLoginResult(tabId, email, sendResponse);
    return true; // Giữ message channel mở cho async response
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN_FACEBOOK') {
    const { email, password, twoFactorCode, proxy, resetLink } = message;
    console.log(`🚀 Bắt đầu quá trình Reset cho: ${email} ${resetLink}`);

    // Hàm thực hiện login
    const performResetPassword = (message) => {
      chrome.tabs.create({ url: message.resetLink }, function(tab) {
        const passwordInput = message.password;
        const tabId = tab.id;
        const delayConfirm = message.delayConfirm ? (message.delayConfirm * 1000) : 5000;
        setTimeout(() => {
          chrome.scripting.executeScript(
          {target: { tabId },
          func: (passwordInput, tabId, delayConfirm) => {
            try {
              console.log(passwordInput);
              console.log(tabId);
              // Tìm input 2FA với nhiều selector khác nhau
              let twoFAInput = document.evaluate("//body//div[contains(@id, 'mount')]//div//div//div//input[contains(@type, 'text')]",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

              // Tìm submit button với nhiều selector khác nhau
              let submitBtn = document.evaluate("//body//div[contains(@id, 'mount')]//div//div//div//input[contains(@type, 'text')]//../../../../../../../../../../../../../../div/div/div[6]/div/div[2]/div[contains(@role,'button')]",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

              if (twoFAInput) {
                // Click vào input để focus và tạo fingerprint
                twoFAInput.click();
                twoFAInput.focus();
                // Xóa giá trị cũ và điền từng ký tự để mô phỏng typing
                twoFAInput.value = '';
                let i = 0;
                const typeChar = () => {
                  if (i < passwordInput.length) {
                    twoFAInput.value += passwordInput[i];
                    // Trigger multiple events để Facebook detect thay đổi
                    const inputEvent = new Event('input', { bubbles: true });
                    twoFAInput.dispatchEvent(inputEvent);
                    const changeEvent = new Event('change', { bubbles: true });
                    twoFAInput.dispatchEvent(changeEvent);
                    const keyEvent = new KeyboardEvent('keyup', { bubbles: true, key: passwordInput[i] });
                    twoFAInput.dispatchEvent(keyEvent);
                    i++;
                    setTimeout(typeChar, 100); // Delay giữa các ký tự
                  } else {
                    // Sau khi điền xong, trigger blur event và click submit
                    twoFAInput.blur();
                    setTimeout(() => {
                      if (submitBtn) {
                        submitBtn.click();
                        // Đóng tab sau khi submit thành công
                        setTimeout(() => {
                          window.close();
                          sendResponse({ success: true });
                        }, delayConfirm);

                      } else {
                        setTimeout(() => {
                          // Nếu không tìm thấy nút submit vẫn đóng tab
                          window.close();
                          sendResponse({ success: true, message: 'Không thấy Button submit' });                  
                        }, delayConfirm);
                      }
                    }, 2000);
                  }
                };
                setTimeout(typeChar, 1000);
              } else {
                setTimeout(() => {
                  window.close();
                  sendResponse({ success: false, message: "Lỗi giao diện" });
                }, delayConfirm);
              }
            } catch(error) {
              setTimeout(() => {
                window.close();
                sendResponse({ success: false, message: "Có lỗi xảy ra..." });
              }, delayConfirm);
            }
          },
          args: [passwordInput, tabId, delayConfirm]})
        }, 2500);
      });

    };

    // Bỏ kiểm tra captcha, tiếp tục login ngay
    console.log('� Bắt đầu quá trình login...');
    performResetPassword(message);
    return true;
  }
});

function injectLoginScript(tabId, email, password, twoFactorCode) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (email, password, twoFactorCode) => {
      var baseStartTime = 2500;
      setTimeout(() => {
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) emailInput.value = email;
      }, baseStartTime);
      setTimeout(() => {
        const passInput = document.querySelector('input[name="pass"]');
        if (passInput) passInput.value = password;
      }, baseStartTime + 1000);
      setTimeout(() => {
        const loginBtn = document.querySelector('button[name="login"], input[type="submit"][name="login"]');
        if (loginBtn) {
          loginBtn.click();
          console.log('✅ Đã click nút Login');
          
          // Kiểm tra captcha sau khi click login button
          setTimeout(() => {
            console.log('🔍 Kiểm tra captcha sau khi click Login...');
            
            // Kiểm tra các element captcha có thể xuất hiện
            const captchaSelectors = [
              'iframe[src*="recaptcha"]',
              'div[data-sitekey]',
              'div[id*="captcha"]',
              'div[class*="captcha"]',
              'div[class*="recaptcha"]',
              '[data-testid*="captcha"]',
              'div[aria-label*="captcha"]',
              'div[aria-label*="verification"]',
              'form[action*="captcha"]',
              'div[role="dialog"]:has([src*="captcha"])',
              '.captcha-container',
              '#captcha',
              '.g-recaptcha'
            ];
            
            let captchaFound = false;
            let captchaType = '';
            
            // Kiểm tra từng selector
            for (const selector of captchaSelectors) {
              try {
                const captchaElement = document.querySelector(selector);
                if (captchaElement && captchaElement.offsetParent !== null) {
                  captchaFound = true;
                  captchaType = selector;
                  console.log(`⚠️ Phát hiện captcha element: ${selector}`);
                  break;
                }
              } catch (e) {
                // Ignore selector errors
              }
            }
            
            // Kiểm tra text chứa từ khóa captcha
            if (!captchaFound) {
              const textElements = document.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, label');
              for (const element of textElements) {
                const text = element.textContent.toLowerCase();
                if ((text.includes('captcha') || 
                    text.includes('robot') || 
                    text.includes('verification') ||
                    text.includes('security check') ||
                    text.includes('prove you') ||
                    text.includes('human') ||
                    text.includes('kiểm tra bảo mật') ||
                    text.includes('xác minh') ||
                    text.includes('bạn là người')) && 
                    element.offsetParent !== null) {
                  captchaFound = true;
                  captchaType = 'text-based detection';
                  console.log(`⚠️ Phát hiện captcha qua text: "${text.substring(0, 50)}..."`);
                  break;
                }
              }
            }
            
            // Kiểm tra URL có chứa captcha không
            if (!captchaFound && (window.location.href.includes('captcha') || 
                                 window.location.href.includes('checkpoint') ||
                                 window.location.href.includes('security') ||
                                 window.location.href.includes('verify'))) {
              captchaFound = true;
              captchaType = 'URL-based detection';
              console.log(`⚠️ Phát hiện captcha qua URL: ${window.location.href}`);
            }
            
            if (captchaFound) {
              console.log(`🛑 CAPTCHA DETECTED - Type: ${captchaType}`);
              console.log('⏰ Người dùng cần giải captcha. Đợi thêm 40 giây...');
              
              // Gửi thông báo về background script để tăng thời gian chờ
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'CAPTCHA_DETECTED_AFTER_LOGIN',
                  email: email,
                  captchaType: captchaType,
                  url: window.location.href,
                  timestamp: new Date().toISOString(),
                  needExtraWait: true
                });
              }
              
            } else {
              console.log('✅ Không phát hiện captcha sau khi login');
              
              // Gửi thông báo không có captcha
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'NO_CAPTCHA_AFTER_LOGIN',
                  email: email,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                });
              }
            }
            
          }, 3000); // Đợi 3 giây sau khi click login để page load
        }
      }, (baseStartTime + 2000));
    },
    args: [email, password, twoFactorCode || '']
  });

  setTimeout(() => {
    chrome.scripting.executeScript({
    target: { tabId },
    func: (email, password, twoFactorCode, get2FACode) => {
      // Bước 1: Click nút mở lựa chọn xác thực (nếu có)
      setTimeout(() => {
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, true);
        const openOptionsElement = document.querySelector('div[role="button"] div[role="none"]');
        if (openOptionsElement) {

          openOptionsElement.dispatchEvent(evt);
        } else {
          console.log('Không tìm thấy nút mở lựa chọn 2FA');
        }
      }, 1500);

      // Bước 2: Click chọn phương thức nhập mã 2FA (label thứ 2)
      setTimeout(() => {
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, true);
        const chooseOptionElement = document.evaluate(
          "//body//div[contains(@id,'mount')]//div//div//div[contains(@role,'dialog')]//div[contains(@aria-hidden,'false')]//div//div//div//label[contains(@tabindex, '-1')][2]",
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;
        chooseOptionElement.click();
      }, (3000));

      // Bước 3: Click xác nhận lựa chọn (nếu có)
      setTimeout(() => {
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, true);
        const confirmBtn = document.evaluate(
          "//body//div[contains(@id,'mount')]//div//div//div[contains(@role,'dialog')]//div[contains(@aria-hidden,'false')]//div[contains(@role,'button')]//div[contains(@role,'none')]//div[contains(@role,'none')]/..",
          document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;
        confirmBtn.click();
      }, 5000);
      
      if (twoFactorCode) {
        setTimeout(() => {
          const twoFAInput = document.evaluate("//form[contains(@method, 'GET')]//div//div//div//input[contains(@type, 'text')]",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          const submitBtn = document.evaluate("//div//div//div//div//div[contains(@role,'none')]//div[contains(@role,'none')]/..",document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          // var time = 3;
          // while (!twoFactorInput && time > 0) {
          //   setTimeout(() => {
          //     time = time - 1;
          //   }, 12000);
          // }
          // console.log(twoFactorInput);
          // twoFAInput.value = res2FA.token
          // setTimeout(() => {
          //     if (submitBtn) submitBtn.click();  
          //   }, 1500);

          // ftech2FA.then((res2FA)=> {
          //   if (res2FA && res2FA.token) twoFAInput.value = res2FA.token;
          //   setTimeout(() => {
          //     if (submitBtn) submitBtn.click();  
          //   }, 1500);
          // }).catch(err=> console.log(err))

          // fetch(`https://2fa.live/tok/${twoFactorCode}`).then((res2FA)=> {
          //   if (res2FA && res2FA.token) twoFAInput.value = res2FA.token;
          //   setTimeout(() => {
          //     if (submitBtn) submitBtn.click();  
          //   }, 1500);
          // }).catch(err=> console.log(err))
        }, 6500);
      }
    },
    args: [email, password, twoFactorCode || '']
  });
  }, 15000);

}

// Biến lưu thông tin xác thực proxy hiện tại
let currentProxyAuth = { username: '', password: '' };

// Lắng nghe message SET_PROXY để gắn proxy cho trình duyệt
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message && message.type === 'SET_PROXY' && message.proxy) {
    try {
      const proxyParts = message.proxy.split(':');
      chrome.proxy.settings.set({
        value: {
          mode: 'fixed_servers',
          rules: {
            singleProxy: {
              scheme: 'http',
              host: proxyParts[0],
              port: parseInt(proxyParts[1])
            },
            bypassList: ['<local>']
          }
        },
        scope: 'regular'
      }, function() {
        // Lưu thông tin xác thực proxy nếu có
        currentProxyAuth.username = proxyParts[2] || '';
        currentProxyAuth.password = proxyParts[3] || '';
        sendResponse({ success: true });
      });
    } catch (err) {
      sendResponse({ success: false, error: err });
    }
    return true;
  }
});

// Thiết lập xác thực proxy động
chrome.webRequest.onAuthRequired.addListener(
  function(details, callbackFn) {
    callbackFn({
      authCredentials: {
        username: currentProxyAuth.username,
        password: currentProxyAuth.password
      }
    });
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);


chrome.action.onClicked.addListener(function(tab) {
  chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});

function _TabCreateOrFocus(url) {
  chrome.tabs.query({ url: url }, function(tab) {
    if (tab.length) {
      chrome.tabs.update(tab[0].id, {
        active: true
      });
    } else {
      chrome.tabs.create({
        url: url,
        active: true
      });
    }
  });
}
