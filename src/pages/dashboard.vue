<script setup lang="ts">
import AnalyticsAward from '@/views/dashboard/AnalyticsAward.vue';
import AnalyticsBarCharts from '@/views/dashboard/AnalyticsBarCharts.vue';
import AnalyticsDepositWithdraw from '@/views/dashboard/AnalyticsDepositWithdraw.vue';
import AnalyticsSalesByCountries from '@/views/dashboard/AnalyticsSalesByCountries.vue';
import AnalyticsTotalEarning from '@/views/dashboard/AnalyticsTotalEarning.vue';
import AnalyticsTotalProfitLineCharts from '@/views/dashboard/AnalyticsTotalProfitLineCharts.vue';
import AnalyticsTransactions from '@/views/dashboard/AnalyticsTransactions.vue';
import AnalyticsUserTable from '@/views/dashboard/AnalyticsUserTable.vue';
import AnalyticsWeeklyOverview from '@/views/dashboard/AnalyticsWeeklyOverview.vue';
import CardStatisticsVertical from '@core/components/cards/CardStatisticsVertical.vue';
import triangleDark from '@images/misc/triangle-dark.png'
import triangleLight from '@images/misc/triangle-light.png'
import trophy from '@images/misc/pricing-tree-3.png'
import { useTheme } from 'vuetify'
import { ref } from 'vue';
import Dcom  from './Services/dcom.js';
// import {runCommand}  from './Services/dcom.js';

import { loginAccount, resetDcom, BASE_URL, BASE_URL_2, loginTemplate }  from './Services/LoginService.ts';
import { saveAs } from 'file-saver';

interface DataItem {
  uid: string
  description: string
  status: number
  password: string
  token?: number
  access_token?: string
  cookie: string
  raw_access_token?: string
  raw_cookie?: string
}

const data : DataItem[] = ref([])
const delayResetPassword: number = ref(20);
const newPasswordAccount = ref("Anhemminh123");
const status: Record<DataItem['status'], string> = {
  1: 'Authen2FA',
  2: 'Live',
  3: 'CheckPoint',
  4: 'Error',
  5: 'OtherError',
}

const statusColor: Record<typeof status[number], string> = {
  Authen2FA: 'primary',
  Live: 'success',
  CheckPoint: 'warning',
  Error: 'error',
  OtherError: 'error',
}

const headers = [
  'Trạng thái',
  'UID',
  'Hot Mail',
  'PassMail',
  'Oauth2',
  ''
]

const usreList = data
const liveCount = ref(0)
const liveAccounts = [];

const cpCount = ref(0)
const cpAccounts = [];

const authenCount = ref(0)
const authenAccounts = [];

const errorCount = ref(0)
const errorAccounts = [];

interface Statistic {
  id: number; 
  stats: number; 
  title: string;
  icon: string;
  color: string;
}

const statistics: Statistic[] = [
]

const { global } = useTheme()
const triangleBg = computed(() => global.name.value === 'light' ?  triangleLight : triangleDark)
const isProxy = ref(true);
const isDcom = ref(false);
const proxies = ref("");
const objProxies = ref([]);

const changeCheckboxOption = function(){
  isDcom.value = !isProxy.value;
}

const changeCheckboxOptionDcom = function(){
  isProxy.value = !isDcom.value;
}

var getProxyCount = function() {
  return "Cấu hình Proxy/Dcom "
   + (proxies.value && isProxy.value  ? " => Proxy: " + proxies.value.trim() : "");
};

const fileContent = ref("");
const fileInput = ref();
const fileName = ref("");

const threadCountReset = ref(1200); // Reset Dcom sau mỗi 1800 Request
const dcomName = ref("Mobifone")
const delayResetDcom = ref(1)
const loginRunning = ref(false);
const blockedAllProxy = ref(false);
const DELAY_REQUEST = ref(250); // Delay giữa mỗi lần call Request Tránh lỗi 613
const LIMIT_REQUEST_PER_PROXY = ref(10); // Số lần chạy Request với Proxy 
const BREAKING_TIME_PER_LIMIT_REQUEST = ref(1); // Thời gian delay giữa LIMIT_REQUEST_PER_PROXY lần chạy request với Proxy

const copyAccountClipboard = function(rowItem){
  //console.log(rowItem);
  if (navigator.clipboard) {
    const textToCopy = `${rowItem.uid}|${rowItem.password.replace('\r', '')}|${rowItem.raw_access_token}|${rowItem.raw_cookie}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
      })
      .catch(err => {
      });
  } else {
    console.error('Trình duyệt không hỗ trợ Clipboard API.');
  }
}

const runLoginAction = function(){
  var accounts = fileContent.value.split('\n').filter(x=>x && x.split('|').length >=5);
  
  if (!accounts || accounts.length == 0 ) {
    alert("File nhập vào trống. Vui lòng kiểm tra lại");
    return;
  }
  

  RunResetPassByJs(accounts);

  // if (isProxy.value) {
  //   loginRunning.value = true;
  //   objProxies.value = [];
  //   // Chỉ sử dụng 1 proxy duy nhất
  //   if (proxies.value && proxies.value.trim()) {
  //     objProxies.value.push({proxy: proxies.value.trim(), isBlocked_1: false, isBlocked_2: false});
  //   }
  //   RunResetPassByJs(accounts, objProxies);
  //   // RunLoginWithProxy(accounts, objProxies);
  //   return;
  // } else {
  //   loginRunning.value = true;
  //   RunLoginWithDcom(accounts);
  // }
}

const RunLoginWithDcom = async function(accounts: string[]){
  let index = 0;
  let actionAccounts = []
  for (index = 0; index < accounts.length; index++) {
    actionAccounts.push(accounts[index]);
    if (actionAccounts.length == threadCountReset.value) {
      if (!loginRunning.value) return;
      var tempActionAccounts = JSON.parse(JSON.stringify(actionAccounts));
      if (!isValidAccounts()) {
        await RunLoginThreadByActionAccountsVersion2(tempActionAccounts);
      } else {
        await RunLoginThreadByActionAccounts(tempActionAccounts);
      }
      //console.log(`Checked ${threadCountReset.value} UID`);
      actionAccounts = [];
      let resetDcomRes = await resetDcom(dcomName.value);
      //console.log("Reset Dcom ===> " + resetDcomRes);
      await wait(delayResetDcom.value * 1000);
    }
    
    if (index +1 == accounts.length) {
      if (isValidAccounts()) {
        RunLoginThreadByActionAccounts(actionAccounts, true).then((res)=> {
          downloadData();
        }).catch((err)=> {
          //console.log(err);
        });
      } else {
        await RunLoginThreadByActionAccountsVersion2(actionAccounts, true);
      }
      
      loginRunning.value = false;
      return;
    }
  }
  
}

const wait = function(ms) {
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve()
      }, ms);
  });
}

const RunLoginThreadByActionAccounts = async function (accounts:string[], isForceRun: bool = false) {
  return Promise.all(
    accounts.map(async (account, index) => {
      if (!isForceRun && !loginRunning.value) return;
      await wait(index * DELAY_REQUEST.value);
      try {
        if (!isForceRun && !loginRunning.value) return;
        var response = await loginAccount([account.split('|')[0], account.split('|')[1]], true, false);
        SetLoginStateValue(response, account);
      } catch (error) {
        //console.log(error.message);
      }
    })
  )
}


const RunLoginThreadByActionAccountsVersion2 = async function (accounts:string[], isForceRun: bool = false) {
  let index = 0;
  let actionAccounts = []
  let customErrorCount = runValidAfter.value;
  for (index = 0; index < accounts.length; index++) {
    actionAccounts.push(accounts[index]);
    if (actionAccounts.length == runValidAfter.value) {
      for (let index2 = 0; index2 < actionAccounts.length; index2++) {
        var account = actionAccounts[index2];
        // actionAccounts.map(async (account, index2) => {
        if (!isForceRun && !loginRunning.value) return;
        await wait(DELAY_REQUEST.value);
        try {
          if (!isForceRun && !loginRunning.value) return;
          if (errorResponseCount == 0) {
            //console.log("====================================================");
            await loginAccount([GetRandomAccountValid().split('|')[0], GetRandomAccountValid().split('|')[1]], true, false);
            errorResponseCount = customErrorCount
            var response = await loginAccount([account.split('|')[0], account.split('|')[1]], true, false);
            SetLoginStateValue(response, account);
          } else {
            var response = await loginAccount([account.split('|')[0], account.split('|')[1]], true, false);
            SetLoginStateValue(response, account);
          }
        } catch (error) {
          //console.log(error.message);
        }
      }
      actionAccounts = [];
    }

    // Nếu danh sách còn account chưa chạy 
    if (index + 1 == accounts.length && actionAccounts.length > 0) {
      Promise.all(
        actionAccounts.map(async (account, index) => {
        if (!isForceRun && !loginRunning.value) return;
        await wait(DELAY_REQUEST.value);
        try {
          if (!isForceRun && !loginRunning.value) return;
          if (errorResponseCount == 0) {
            //console.log("====================================================");
            await loginAccount([GetRandomAccountValid().split('|')[0], GetRandomAccountValid().split('|')[1]], true, false);
            errorResponseCount = customErrorCount
            var response = await loginAccount([account.split('|')[0], account.split('|')[1]], true, false);
            SetLoginStateValue(response, account);
          } else {
            var response = await loginAccount([account.split('|')[0], account.split('|')[1]], true, false);
            SetLoginStateValue(response, account);
          }
        } catch (error) {
          //console.log(error.message);
        }
      })).then((res)=> {
        downloadData();
      })
    }
  }
}

const GetRandomAccountValid = function(){
  let accounts = validAccounts.value.split('\n').filter(x=>x.length && x.trim().length && x.indexOf('|') > 0);
  return accounts[Math.floor(Math.random() * accounts.length)]
}

var indexRunningAccount = ref(0)
const ACTION_RESULTS  = ref([]);

const RunResetPassByJs = async function(accounts: string[]){
  indexRunningAccount.value = 0;
  let index = 0;
  var breakTimeStep = BREAKING_TIME_PER_LIMIT_REQUEST.value * 1000; // Delay giữa {threadActionCount} luồng 
  
  var accountsList = JSON.parse(JSON.stringify(accounts));
  for (let index = 0; index < accountsList.length; index++) {
    accountsList[index] = accountsList[index].replace('\r','') + '|';
  }

  ACTION_RESULTS.value = [];
  console.log('🚀 Bắt đầu Reset', accountsList.length, 'tài khoản');

  for (let i = 0; i < accountsList.length; i++) {
    
    const account = accountsList[i];
    console.log(`📋 Processing account ${i + 1}/${accountsList.length}:`, account.split('|')[0]);
    
    try {
      const newPassword = newPasswordAccount.value;
      var inputInfo = account.split('|');
      inputInfo[2] = newPassword;
      const result = await loginAccount(inputInfo, newPassword);
      await wait(delayResetPassword.value * 1000);
      
      ACTION_RESULTS.value.push({result: result, account: accountsList[i]});
    } catch (err) {
      console.error('❌ Lỗi khi login account:', account.split('|')[0], err);
      // Tạo error response với format chuẩn
      const errorResponse = {
        success: false,
        isLoginSuccess: false,
        isCheckPointAccount: false,
        message: err.message || err.toString(),
        error: true,
        timestamp: new Date().toISOString()
      };
      ACTION_RESULTS.value.push({result: errorResponse, account: accountsList[i]});
    }
  }

  console.log('✅ Hoàn thành login cho tất cả tài khoản');
  loginRunning.value = false;
}

const RunLoginByJs = async function(accounts: string[], tempObjProxies: Array[]){
  indexRunningAccount.value = 0;

  var threadActionCount = (tempObjProxies && tempObjProxies.length) ? tempObjProxies.length * LIMIT_REQUEST_PER_PROXY.value : LIMIT_REQUEST_PER_PROXY.value; // Số luồng chạy tối đa 1 lần (1 proxy chạy 20 luồng)
  var breakTimeThreads = 0;

  let index = 0;
  var breakTimeStep = BREAKING_TIME_PER_LIMIT_REQUEST.value * 1000; // Delay giữa {threadActionCount} luồng 

  var accountsList = JSON.parse(JSON.stringify(accounts));
  for (let index = 0; index < accountsList.length; index++) {
    accountsList[index] = accountsList[index].replace('\r','') + '|';
  }

  const results = [];
  var validProxy = proxies.value && proxies.value.trim() && 
    (proxies.value.trim().split(':').length == 2 || proxies.value.trim().split(':').length == 4) 
    ? proxies.value.trim() : '';
  
  // Gắn proxy cho tất cả accounts
  if (validProxy) {
    for (let i = 0; i < accountsList.length; i++) {
      accountsList[i] = accountsList[i] + validProxy;
    }
  }

  console.log('🚀 Bắt đầu Reset', accountsList.length, 'tài khoản');
  console.log(accountsList);
  
  for (let i = 0; i < accountsList.length; i++) {
    if (!loginRunning.value) {
      console.log('❌ Reset bị dừng bởi user');
      break;
    }
    
    const account = accountsList[i];
    console.log(`📋 Processing account ${i + 1}/${accountsList.length}:`, account.split('|')[0]);
    
    try {
      const result = await loginAccount(account.split('|'), false, false);
      
      // Đợi 2 phút để Chrome Extension xử lý login
      console.log('⏰ Đợi Chrome Extension xử lý login...');
      await wait(120000);
      
      console.log('📊 Kết quả login:', new Date(), account.split('|')[0]);
      console.log('📊 Response data:', result);

      SetLoginStateValueV2(result, account);
      results.push(result);
      
    } catch (err) {
      console.error('❌ Lỗi khi login account:', account.split('|')[0], err);
      console.log('⏰ Timestamp:', new Date());
      
      // Tạo error response với format chuẩn
      const errorResponse = {
        success: false,
        isLoginSuccess: false,
        isCheckPointAccount: false,
        message: err.message || err.toString(),
        error: true,
        timestamp: new Date().toISOString()
      };
      
      SetLoginStateValueV2(errorResponse, account);
      results.push(errorResponse);
    }
  }

  console.log('✅ Hoàn thành login cho tất cả tài khoản');
  loginRunning.value = false;
  
  // Tự động download kết quả sau khi hoàn thành
  setTimeout(() => {
    downloadData();
  }, 2000);
}

const RunLoginWithProxy = function(accounts: string[], tempObjProxies: Array[]){
  indexRunningAccount.value = 0;

  var threadActionCount = (tempObjProxies && tempObjProxies.length) ? tempObjProxies.length * LIMIT_REQUEST_PER_PROXY.value : LIMIT_REQUEST_PER_PROXY.value; // Số luồng chạy tối đa 1 lần (1 proxy chạy 20 luồng)
  var breakTimeThreads = 0;
  let index = 0;
  var breakTimeStep = BREAKING_TIME_PER_LIMIT_REQUEST.value * 1000; // Delay giữa {threadActionCount} luồng 
  // accounts.forEach(async (account, index) => {
  for (index = 0; index < accounts.length; index++) {
    const account = accounts[index];
    if (!loginRunning.value) break;

    if (threadActionCount == index) {
      threadActionCount = threadActionCount + threadActionCount;
      breakTimeThreads = breakTimeThreads + breakTimeStep;
    }

    setTimeout(async () => {
      try {
        indexRunningAccount.value = indexRunningAccount.value + 1;
        if (!loginRunning.value) return;
        var proxy = GetRandProxyValid(tempObjProxies);

        if (!proxy && (tempObjProxies.length == 0)) {
          proxy = {proxy: "NoneProxy", isBlocked_1: false, isBlocked_2: false};
        } else if (!proxy && (tempObjProxies.length > 0)) {
          //console.log("Proxy bị chặn");
          loginRunning.value = false;
          blockedAllProxy.value = true;
        }
        var response = await loginAccount([account.split('|')[0], account.split('|')[1], proxy], proxy.isBlocked_1, proxy.isBlocked_2);
        // Nếu báo lỗi bị chặn API
        if (response && (response.error_code == 368 || response.error_code == 190))
        {
          // ==> Kiểm tra và Thử lại với API còn lại
          if (response.urlAction == BASE_URL) proxy.isBlocked_1 = false; 
          if (response.urlAction == BASE_URL_2) proxy.isBlocked_2 = false; 

          if (!proxy.isBlocked_1 || !proxy.isBlocked_2){
            response = await loginAccount([account.split('|')[0], account.split('|')[1], proxy], proxy.isBlocked_1, proxy.isBlocked_2);
            // Vẫn báo bị chặn => Đánh dấu IP bị chặn hoàn toàn
            if (response && (response.error_code == 368 || response.error_code == 190)){
              proxy.isBlocked_1 = false; 
              proxy.isBlocked_2 = false; 
            }
            SetLoginStateValue(response, account);
          } else {
            SetLoginStateValue(response, account);
          }
        } else {
          SetLoginStateValue(response, account);
        }
      } catch (error) {
        //console.log(error.message);
      }
      if ((indexRunningAccount.value + 1) >= accounts.length) {
        loginRunning.value = false;
      }
      
    }, breakTimeThreads + index * DELAY_REQUEST.value);
  }

  setTimeout(() => {
    if (blockedAllProxy.value) alert("Proxy đã bị chặn");  
  }, breakTimeThreads + index * 8 + 200);
}

// Lấy thông tin Proxy hợp lệ (Chưa bị Block)
const GetRandProxyValid= function(tmpProxies: Array[]) {
  var validProxies = tmpProxies.value.filter(x=>!x.isBlocked_1 || !x.isBlocked_2);
  if (!validProxies || !validProxies.length) return null;
  return validProxies[Math.floor(Math.random() * tmpProxies.value.length)];
}


// Cập nhật thông tin kết quả chạy từ Response Chrome Extension
const SetLoginStateValueV2 = function(response, account){  
  console.log('=== SetLoginStateValueV2 Debug ===');
  console.log('Response:', JSON.stringify(response, null, 2));
  console.log('Account:', account);
  console.log('Response properties:');
  console.log('- success:', response?.success);
  console.log('- isLoginSuccess:', response?.isLoginSuccess);
  console.log('- isCheckPointAccount:', response?.isCheckPointAccount);
  console.log('- error:', response?.error);
  console.log('- message:', response?.message);
  console.log('- cookies:', response?.cookies);
  console.log('- cookies.c_user:', response?.cookies?.c_user);
  console.log('- cookies.total:', response?.cookies?.total);
  console.log('==================================');
  
  // Xử lý trường hợp lỗi hoặc không có response
  if (!response) {
    console.log('❌ Không có response');
    errorCount.value = errorCount.value + 1;
    addAccountToTable(account, 4, 'Không có phản hồi từ extension');
    return;
  }

  // Lấy thông tin từ response
  const message = response.message || response.error || '';
  const messageText = message.toLowerCase();
  const hasCookies = response.cookies && response.cookies.c_user && response.cookies.c_user.length > 0;
  const cookiesTotal = response.cookies ? response.cookies.total || 0 : 0;
  
  // BƯỚC 1: Kiểm tra checkpoint TRƯỚC TIÊN (ưu tiên cao nhất)
  // Kiểm tra qua response.isCheckPointAccount hoặc từ message
  const isCheckpointFromFlag = response.isCheckPointAccount === true;
  const isCheckpointFromMessage = messageText.includes('checkpoint') || 
                                  messageText.includes('security check') ||
                                  messageText.includes('security') ||
                                  messageText.includes('verify') ||
                                  messageText.includes('verification') ||
                                  messageText.includes('bị checkpoint') ||
                                  messageText.includes('(url)') ||
                                  messageText.includes('(cookie)') ||
                                  messageText.includes('tài khoản bị checkpoint');
  
  if (isCheckpointFromFlag || isCheckpointFromMessage) {
    console.log('⚠️ Phát hiện checkpoint - Cập nhật cpCount từ', cpCount.value, 'lên', cpCount.value + 1);
    console.log('⚠️ Nguyên nhân: isCheckpointFromFlag =', isCheckpointFromFlag, ', isCheckpointFromMessage =', isCheckpointFromMessage);
    cpCount.value = cpCount.value + 1;
    addAccountToTable(account, 3, message || 'Tài khoản bị checkpoint');
    cpAccounts.push(`${account.split('|')[0]}|${account.split('|')[1]}`);
    return;
  }

  // BƯỚC 2: Kiểm tra đăng nhập thành công
  // Coi như thành công nếu:
  // 1. response.isLoginSuccess === true HOẶC
  // 2. Có cookies c_user hợp lệ HOẶC  
  // 3. response.success === true VÀ không có lỗi rõ ràng
  const isExplicitSuccess = response.isLoginSuccess === true;
  const hasValidCookies = hasCookies && response.cookies.c_user.length > 5; // User ID Facebook thường > 5 ký tự
  const isImplicitSuccess = response.success === true && !response.error && cookiesTotal > 5;
  
  if (isExplicitSuccess || hasValidCookies || isImplicitSuccess) {
    console.log('✅ Đăng nhập thành công - Cập nhật liveCount từ', liveCount.value, 'lên', liveCount.value + 1);
    console.log('✅ Lý do thành công:');
    console.log('   - isExplicitSuccess (isLoginSuccess=true):', isExplicitSuccess);
    console.log('   - hasValidCookies (c_user có giá trị):', hasValidCookies);
    console.log('   - isImplicitSuccess (success=true + nhiều cookies):', isImplicitSuccess);
    
    liveCount.value = liveCount.value + 1;
    
    // Tạo thông tin account với cookie và access token (nếu có)
    const accountInfo = {
      uid: account.split('|')[0],
      password: account.split('|')[1],
      status: 2, // Live
      description: response.message || 'Đăng nhập thành công',
      access_token: 'Từ Extension',
      cookie: formatCookiesFromResponse(response.cookies),
      raw_access_token: 'Extension_Token',
      raw_cookie: formatFullCookiesFromResponse(response.cookies)
    };
    
    data.value.unshift(accountInfo);
    
    // Thêm vào danh sách live accounts để download
    const accountFullInfo = `${account}|Extension_Token|${accountInfo.raw_cookie}`;
    liveAccounts.push(accountFullInfo.replace('\r', ''));
    console.log('✅ Đã thêm vào liveAccounts. Total liveCount:', liveCount.value);
    return;
  }

  // BƯỚC 3: Trường hợp còn lại - Coi như lỗi
  console.log('❌ Đăng nhập thất bại - Cập nhật errorCount từ', errorCount.value, 'lên', errorCount.value + 1);
  console.log('❌ Lý do thất bại:');
  console.log('   - response.success:', response.success);
  console.log('   - response.isLoginSuccess:', response.isLoginSuccess);
  console.log('   - response.error:', response.error);
  console.log('   - hasCookies:', hasCookies);
  console.log('   - cookiesTotal:', cookiesTotal);
  
  errorCount.value = errorCount.value + 1;
  addAccountToTable(account, 4, message || 'Lỗi đăng nhập');
  errorAccounts.push(`${account.split('|')[0]}|${account.split('|')[1]}|${message || 'Lỗi đăng nhập'}`);
}

// Cập nhật thông tin kết quả chạy từ Response API
const SetLoginStateValue = function(response, account){  
  if (!response) {
    // statistics[3].stats = statistics[3].stats + 1;
    errorCount.value = errorCount.value + 1;
    return;
  };

  // let resCodes = [401, 405, 406, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 401, 405, 405, 405, 405, 405, 406, 406, 406]
  // response.error_code = resCodes[Math.floor(Math.random() * resCodes.length)];
  // //console.log(`${response.error_code} ==> ${account}`);

  // Đăng nhập thành công
  var rowAccountInfo: DataItem = {uid: account.split('|')[0], password: account.split('|')[1], status: -1, description: "", access_token: "", cookie: ""};
  if (!response.error_code && response.access_token ){
    // //console.log(`${response.error_code} ==> ${account}`);
    rowAccountInfo.status = 2;
    liveCount.value = liveCount.value + 1;
    // statistics[0].stats = statistics[0].stats + 1;
    var accountInfo = GetLogedInInfoContent(response, rowAccountInfo);
    var accountFullInfo = `${account}|${accountInfo}`;
    liveAccounts.push(accountFullInfo.replace('\r', ''));

  } else {
    // Có lỗi xảy ra
    switch (response.error_code) {
      case "405":
      case 405:
        cpCount.value = cpCount.value + 1;
        rowAccountInfo.status = 3;
        data.value.push(rowAccountInfo);
        cpAccounts.push(`${account.split('|')[0]}|${account.split('|')[1]}`);

        // statistics[1].stats = statistics[1].stats + 1;
        break;
      case "406":
      case 406:
        rowAccountInfo.status = 1;
        data.value.push(rowAccountInfo);
        authenAccounts.push(`${account.split('|')[0]}|${account.split('|')[1]}`);
        authenCount.value = authenCount.value + 1;

        // statistics[2].stats = statistics[2].stats + 1;
        break;
      case "401":
      case 401:
        errorResponseCount = errorResponseCount - 1;
        //console.log(`401 ==> ${account}`);
      default:
        // errorResponseCount = errorResponseCount - 1;
        errorAccounts.push(`${account.split('|')[0]}|${account.split('|')[1]}|${response.error_msg}`);
        errorCount.value = errorCount.value + 1;
        // statistics[3].stats = statistics[3].stats + 1;
        break;
    }
  }
}


const stopLoginAction = function(){
  loginRunning.value = false;
}

const downloadFileByContent = function(fileContent, filename){
  // Create a Blob from the data
  const blob = new Blob([fileContent], { type: 'text/plain' });

  // Create a link element
  const link = document.createElement('a');

  // Set the link's href attribute to a data URL containing the blob data
  link.href = window.URL.createObjectURL(blob);

  // Specify the file name for the download
  link.download = filename;

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click event on the link to start the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}

const downloadData = function(){
  var timeStamp = Date.now();
  var dateTimeInfo = `${new Date(Date.now()).getFullYear()}${(new Date(Date.now()).getMonth() + 1).toString().padStart(2, '0')}${new Date(Date.now()).getDate().toString().padStart(2, '0')}_${new Date(Date.now()).getHours().toString().padStart(2, '0')}${new Date(Date.now()).getMinutes().toString().padStart(2, '0')}`;
  
  // Tạo danh sách tài khoản theo từng trạng thái từ data table
  const liveAccountsFromTable = [];
  const checkpointAccountsFromTable = [];
  const errorAccountsFromTable = [];
  
  // Phân loại tài khoản từ bảng data
  data.value.forEach(account => {
    const accountLine = `${account.uid}|${account.password}`;
    const accountWithDetails = account.raw_access_token && account.raw_cookie 
      ? `${accountLine}|${account.raw_access_token}|${account.raw_cookie}`
      : accountLine;
    
    switch(account.status) {
      case 2: // Live
        liveAccountsFromTable.push(accountWithDetails);
        break;
      case 3: // Checkpoint
        checkpointAccountsFromTable.push(`${accountLine}|${account.description || 'Checkpoint detected'}`);
        break;
      case 1: // Authen2FA - Treat as error since we removed 2FA button
      case 4: // Error
      case 5: // Other Error
        errorAccountsFromTable.push(`${accountLine}|${account.description || 'Login failed'}`);
        break;
    }
  });
  
  // Gộp với danh sách từ các array cũ (backward compatibility)
  const allLiveAccounts = [...new Set([...liveAccounts, ...liveAccountsFromTable])];
  const allCpAccounts = [...new Set([...cpAccounts, ...checkpointAccountsFromTable])];
  const allErrorAccounts = [...new Set([...errorAccounts, ...errorAccountsFromTable])];
  
  // Tạo summary file
  const summaryContent = [
    `=== BÁO CÁO KẾT QUẢ LOGIN FACEBOOK ===`,
    `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
    `Tổng tài khoản xử lý: ${data.value.length}`,
    ``,
    `📊 THỐNG KÊ:`,
    `✅ Live (Thành công): ${allLiveAccounts.length}`,
    `⚠️  Checkpoint: ${allCpAccounts.length}`,
    `❌ Lỗi/Thất bại: ${allErrorAccounts.length}`,
    ``,
    `📁 FILES ĐƯỢC TẠO:`,
    `- live_${dateTimeInfo}_${timeStamp}.txt (${allLiveAccounts.length} tài khoản)`,
    `- checkpoint_${dateTimeInfo}_${timeStamp}.txt (${allCpAccounts.length} tài khoản)`,
    `- error_${dateTimeInfo}_${timeStamp}.txt (${allErrorAccounts.length} tài khoản)`,
    ``,
    `=== CHI TIẾT THEO TRẠNG THÁI ===`,
    ``
  ].join('\n');
  
  // Download từng file theo trạng thái
  if (allLiveAccounts.length > 0) {
    const liveContent = [
      `# LIVE ACCOUNTS - ${allLiveAccounts.length} tài khoản`,
      `# Format: uid|password|access_token|cookies`,
      `# Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      ...allLiveAccounts
    ].join('\n');
    downloadFileByContent(liveContent, `live_${dateTimeInfo}_${timeStamp}.txt`);
    console.log(`✅ Downloaded ${allLiveAccounts.length} live accounts`);
  }
  
  if (allCpAccounts.length > 0) {
    const cpContent = [
      `# CHECKPOINT ACCOUNTS - ${allCpAccounts.length} tài khoản`,
      `# Format: uid|password|reason`,
      `# Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      ...allCpAccounts
    ].join('\n');
    downloadFileByContent(cpContent, `checkpoint_${dateTimeInfo}_${timeStamp}.txt`);
    console.log(`⚠️ Downloaded ${allCpAccounts.length} checkpoint accounts`);
  }
  
  if (allErrorAccounts.length > 0) {
    const errorContent = [
      `# ERROR ACCOUNTS - ${allErrorAccounts.length} tài khoản`,
      `# Format: uid|password|error_message`,
      `# Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      ``,
      ...allErrorAccounts
    ].join('\n');
    downloadFileByContent(errorContent, `error_${dateTimeInfo}_${timeStamp}.txt`);
    console.log(`❌ Downloaded ${allErrorAccounts.length} error accounts`);
  }
  
  // Download summary file
  downloadFileByContent(summaryContent, `summary_${dateTimeInfo}_${timeStamp}.txt`);
  console.log(`📊 Downloaded summary report`);
  
  // Hiển thị thông báo thành công
}

// Hàm download riêng theo trạng thái
const downloadByStatus = function(statusType) {
  var timeStamp = Date.now();
  var dateTimeInfo = `${new Date(Date.now()).getFullYear()}${(new Date(Date.now()).getMonth() + 1).toString().padStart(2, '0')}${new Date(Date.now()).getDate().toString().padStart(2, '0')}_${new Date(Date.now()).getHours().toString().padStart(2, '0')}${new Date(Date.now()).getMinutes().toString().padStart(2, '0')}`;
  
  let accountsToDownload = [];
  let fileName = '';
  let statusName = '';
  let statusIcon = '';
  
  // Lọc tài khoản theo trạng thái từ bảng data
  switch(statusType) {
    case 'live':
      accountsToDownload = data.value
        .filter(account => account.status === 2)
        .map(account => {
          const accountLine = `${account.uid}|${account.password}`;
          return account.raw_access_token && account.raw_cookie 
            ? `${accountLine}|${account.raw_access_token}|${account.raw_cookie}`
            : accountLine;
        });
      
      // Gộp với danh sách live cũ
      accountsToDownload = [...new Set([...liveAccounts, ...accountsToDownload])];
      fileName = `live_${dateTimeInfo}_${timeStamp}.txt`;
      statusName = 'LIVE ACCOUNTS';
      statusIcon = '✅';
      break;
      
    case 'checkpoint':
      accountsToDownload = data.value
        .filter(account => account.status === 3)
        .map(account => `${account.uid}|${account.password}|${account.description || 'Checkpoint detected'}`);
      
      // Gộp với danh sách checkpoint cũ
      accountsToDownload = [...new Set([...cpAccounts, ...accountsToDownload])];
      fileName = `checkpoint_${dateTimeInfo}_${timeStamp}.txt`;
      statusName = 'CHECKPOINT ACCOUNTS';
      statusIcon = '⚠️';
      break;
      
    case 'authen2fa':
      accountsToDownload = data.value
        .filter(account => account.status === 1)
        .map(account => `${account.uid}|${account.password}|${account.description || 'Requires 2FA'}`);
      
      // Gộp với danh sách 2FA cũ
      accountsToDownload = [...new Set([...authenAccounts, ...accountsToDownload])];
      fileName = `authen2FA_${dateTimeInfo}_${timeStamp}.txt`;
      statusName = '2FA REQUIRED ACCOUNTS';
      statusIcon = '🔐';
      break;
      
    case 'error':
      accountsToDownload = data.value
        .filter(account => account.status === 4 || account.status === 5)
        .map(account => `${account.uid}|${account.password}|${account.description || 'Login failed'}`);
      
      // Gộp với danh sách error cũ
      accountsToDownload = [...new Set([...errorAccounts, ...accountsToDownload])];
      fileName = `error_${dateTimeInfo}_${timeStamp}.txt`;
      statusName = 'ERROR ACCOUNTS';
      statusIcon = '❌';
      break;
      
    default:
      return;
  }
  
  if (accountsToDownload.length === 0) {
    return;
  }
  
  // Tạo nội dung file với header
  const content = [
    `# ${statusName} - ${accountsToDownload.length} tài khoản`,
    `# Thời gian: ${new Date().toLocaleString('vi-VN')}`,
    statusType === 'live' ? `# Format: uid|password|access_token|cookies` : `# Format: uid|password|note`,
    ``,
    ...accountsToDownload
  ].join('\n');
  
  // Tải file
  downloadFileByContent(content, fileName);
  
  // Hiển thị thông báo
  console.log(`${statusIcon} Downloaded ${accountsToDownload.length} ${statusType} accounts`);
}

// Lấy thông tin từ Thông tin tài khoản Login thành công
const GetLogedInInfoContent = function(loginResponse, accountInfo) {
  if (!loginResponse) {
    return '';
  }
  let logedInInfo = '';
  try {
    if (loginResponse.hasOwnProperty('access_token')) {
      logedInInfo = loginResponse.access_token.toString();
      accountInfo.access_token = loginResponse.access_token.toString().substring(0,50) + "......";
      accountInfo.raw_access_token = loginResponse.access_token.toString();
    }

    if (loginResponse.hasOwnProperty('session_cookies')) {
      logedInInfo += '|';
      const sessionInfo = loginResponse.session_cookies;

      for (const sessionObject of sessionInfo) {
        if (sessionObject.hasOwnProperty('name') && sessionObject.hasOwnProperty('value')) {
          logedInInfo += `${sessionObject.name.toString()}=${sessionObject.value.toString()}; `;
          accountInfo.cookie += `${sessionObject.name.toString()}=${sessionObject.value.toString()}; `;
        }
      }
      if (accountInfo.cookie.length > 20) {
        accountInfo.raw_cookie = accountInfo.cookie;
        accountInfo.cookie = accountInfo.cookie.substring(0,50) + "......";
      }
    }
  } catch (ex) {
    // Xử lý ngoại lệ, bạn có thể thay thế bằng cách xử lý theo cách mong muốn
    console.error(`Error in getLogedInInfoContent:`);
    //console.log(ex);
  }
  data.value.unshift(accountInfo);
  return logedInInfo;
}

const handleFileUpload = (event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  const file = inputElement.files?.[0];
  if (file) {
    fileName.value = file.name;

    const reader = new FileReader();

    reader.onload = (event) => {
      // Đọc nội dung file khi tải lên hoàn tất
      fileContent.value = event.target?.result as string;
    };

    // Đọc file với kiểu dữ liệu là văn bản (text)
    reader.readAsText(file);
  }
};

const validAccounts = ref("");
const runValidAfter = ref(10);
var errorResponseCount = runValidAfter.value;
const getTitleAmountValid = function(){
  return `Chạy sau ${runValidAfter.value} tài khoản lỗi`
}

const isValidAccounts = function() : boolean {
  let strAccount = validAccounts.value;
  let filterAccounts = strAccount.split('\n').filter(x=>x.length && x.trim().length && x.indexOf('|') > 0);
  return filterAccounts.length ? false : true;
}

const getLabelFormValidAccount = function(){
  if (!isValidAccounts()) {
    return `${validAccounts.value.split('\n').filter(x=>x.length && x.trim().length && x.indexOf('|') > 0).length} tài khoản`
  }
  return `Tài khoản đúng Pass`
}

// Helper function để format cookie từ response Chrome Extension
const formatCookiesFromResponse = function(cookies) {
  if (!cookies) return '';
  
  const cookieStr = Object.entries(cookies)
    .filter(([key, value]) => key !== 'total' && value)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  
  return cookieStr.length > 50 ? cookieStr.substring(0, 50) + '......' : cookieStr;
}

// Helper function để format full cookie từ response Chrome Extension
const formatFullCookiesFromResponse = function(cookies) {
  if (!cookies) return '';
  
  return Object.entries(cookies)
    .filter(([key, value]) => key !== 'total' && value)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

// Helper function để thêm account vào bảng
const addAccountToTable = function(account, status, description) {
  const rowAccountInfo: DataItem = {
    uid: account.split('|')[0],
    password: account.split('|')[1],
    status: status,
    description: description,
    access_token: '',
    cookie: ''
  };
  data.value.push(rowAccountInfo);
}
</script>

<template>
  <VRow class="match-height">

    <VCol
      cols="12"
    >
    <VCard>
    <VCardItem>
      <VCardTitle>Đổi mật khẩu</VCardTitle>

      <template #append>
        <div class="me-n3">
        </div>
      </template>
    </VCardItem>

    <VCardText>
      <h6 class="text-sm font-weight-medium mb-6">
        <div class="d-flex flex-column gap-3">
          <!-- File upload section -->
          <div class="d-flex align-center gap-3">
            <span>Chọn File tài khoản:</span>
            <input
              ref="fileInput"
              type="file"
              accept=".txt"
              @change="handleFileUpload"
              class="file-input"
            />
          </div>
          
          <!-- Action buttons section -->
          <div class="d-flex align-center gap-2 flex-wrap">
            <!-- Login/Stop buttons -->
            <VBtn 
              v-if="!loginRunning" 
              :disabled="loginRunning" 
              color="primary" 
              @click="runLoginAction"
              size="default"
            >                 
              <VIcon size="20" icon="mdi-account-lock-open-outline" class="mr-2" />
              Reset Pass
            </VBtn>
            
            <VBtn 
              v-if="loginRunning" 
              color="error" 
              @click="stopLoginAction"
              size="default"
            >                 
              <VIcon size="20" icon="mdi-account-alert-outline" class="mr-2" />
              Stop
            </VBtn>
            
            <!-- Download buttons -->
            <VDivider vertical class="mx-2" />
            
            <VBtn 
              color="success" 
              @click="downloadData"
              size="default"
              :disabled="data.length === 0"
            >
              <VIcon size="20" icon="mdi-file-download-outline" class="mr-2" /> 
              Download kết quả
            </VBtn>
            <VTextField
              v-model="newPasswordAccount"
              label="Password mới"
              style="max-width: 240px;"
              type="text"
              variant="outlined"
              density="compact"
            />
            <VTextField
              v-model.number="delayResetPassword"
              label="Delay giữa các lần (s)"
              style="max-width: 240px;"
              max="600"
              type="number"
              min="15"
              variant="outlined"
              density="compact"
              prepend-inner-icon="ri-subtract-line"
              append-inner-icon="ri-add-line"
            />

            <!-- <VBtn 
              color="success" 
              variant="outlined" 
              @click="downloadByStatus('live')"
              size="small"
              :disabled="liveCount === 0"
            >
              <VIcon size="16" icon="mdi-account-check" class="mr-1" /> 
              Live ({{ liveCount }})
            </VBtn>
            
            <VBtn 
              color="warning" 
              variant="outlined" 
              @click="downloadByStatus('checkpoint')"
              size="small"
              :disabled="cpCount === 0"
            >
              <VIcon size="16" icon="mdi-account-alert" class="mr-1" /> 
              CP ({{ cpCount }})
            </VBtn>
            
            <VBtn 
              color="error" 
              variant="outlined" 
              @click="downloadByStatus('error')"
              size="small"
              :disabled="errorCount === 0"
            >
              <VIcon size="16" icon="mdi-account-cancel" class="mr-1" /> 
              Error ({{ errorCount }})
            </VBtn> -->
          </div>
        </div>
      </h6>

      <VRow>
        <VCol
          v-for="(item, index) in statistics"
          :key="item.id"
          cols="6"
          sm="4"
        >
          <div class="d-flex align-center">
            <div class="me-3">
              <VAvatar
                :color="item.color"
                rounded
                size="42"
                class="elevation-1"
              >
                <VIcon
                  size="24"
                  :icon="item.icon"
                />
              </VAvatar>
            </div>

            <div class="d-flex flex-column">
              <span class="text-caption">
                {{ item.title }}
              </span>
              <span class="text-h6">{{ index == 0 ? liveCount : index == 1 ? cpCount : errorCount  }}</span>
              
            </div>
          </div>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
    </VCol>
    <VCol cols="12">
      <VCard>
        <VTable
          
          :headers="headers"
          :items="usreList"
          item-key="uid"
          class="table-rounded"
          hide-default-footer
          disable-sort
          fixed-header
          height=500
        >
          <thead>
            <tr>
              <th
                v-for="header in headers"
                :key="header"
              >
                {{ header }}
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in data"
              :key="row.uid"
            >
              <!-- name -->
              <td>
                <VChip
                  size="small"
                  :color="statusColor[status[row.status]]"
                  class="text-capitalize"
                  >
                  {{ status[row.status] }}
                </VChip>
              </td>
              <td>
                <div class="d-flex flex-column">
                  <h6 class="text-sm font-weight-medium">{{ row.uid }}</h6>
                  <span class="text-xs">{{ row.description }}</span>
                </div>
              </td>

              <td class="text-sm" v-text="row.password" />

              <td class="text-sm" v-text="row.access_token" />
              <td class="text-sm" v-text="`${row.cookie}`" />
              <td class="text-sm"> <VBtn size="small" color="success" @click="copyAccountClipboard(row)">Copy</VBtn></td>
              <!-- status -->

            </tr>
          </tbody>
        </VTable>
      </VCard>
    </VCol>
    <!-- <VCol cols="3">
      <VTextField class="mb-3" rows="1" type="number" v-bind:disabled="isValidAccounts()" v-model="runValidAfter" v-bind:label="getTitleAmountValid()"></VTextField>
      <v-textarea rows="18" v-model="validAccounts" v-bind:label="getLabelFormValidAccount()"></v-textarea>
    </VCol> -->
  </VRow>
</template>

<style lang="scss">
@use "@layouts/styles/mixins" as layoutsMixins;

.v-card .triangle-bg {
  position: absolute;
  inline-size: 10.375rem;
  inset-block-end: 0;
  inset-inline-end: 0;
}

.v-card .trophy {
  position: absolute;
  inline-size: 4.9375rem;
  inset-block-end: 2rem;
  inset-inline-end: 2rem;
}

.file-input {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  font-size: 14px;
  padding-block: 8px;
  padding-inline: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: #1976d2;
    background-color: #f5f5f5;
  }

  &:focus {
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgb(25 118 210 / 20%);
    outline: none;
  }
}

.gap-3 {
  gap: 12px;
}

.gap-2 {
  gap: 8px;
}
</style>
