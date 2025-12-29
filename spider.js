import axios from 'axios';
import fs from 'fs-extra';

// ===================== 核心配置 =====================
const CONFIG = {
  API_URL: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice',
  REQ_PARAMS: {
    name: 'ssq',        // 双色球标识
    issueCount: '',
    issueStart: '',
    issueEnd: '',
    dayStart: '',
    dayEnd: '',
    pageNo: 1,          // 起始页码
    pageSize: 1000,       // 每页条数
    week: '',
    systemType: 'PC'
  },
  HEADERS: {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Connection': 'keep-alive',
    'Referer': 'https://www.cwl.gov.cn/ygkj/wqkjgg/ssq/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Cookie': 'HMF_CI=a680c06d490ee910ac1919762e2c9f457e2936990011af69eb9b656350b08d633e56876376cda16a2ff34ab273e27890813bb4310ba3a5789c2920e03a898fe0f2; 21_vq=20'
  },
  OUTPUT_FILE: './data/ssq-full-data.json', // 最终数据保存路径
  REQUEST_INTERVAL: 1000 // 请求间隔（防封）
};

// ===================== 数据格式化 =====================
/**
 * 格式化单条开奖数据
 * @param {Object} item 接口返回的单条数据
 * @returns {Object} 标准化数据
 */
const formatItem = (item) => {
  // 红球拆分+补零+升序，蓝球补零
  const redBalls = item.red.split(',')
    .map(num => num.padStart(2, '0'))
    .sort((a, b) => a - b);
  const blueBall = item.blue.padStart(2, '0');

  return {
    issue: item.code,                // 期号（如2025146）
    date: item.date.replace(/\(\w+\)/, ''), // 开奖日期（去除星期）
    front: redBalls,                   // 红球数组（升序补零）
    back: blueBall,                  // 蓝球
  };
};

// ===================== 随机号码生成逻辑 =====================
/**
 * 生成指定范围随机整数（含边界）
 */
const getRandomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * 检查号码是否已在历史数据中出现
 * @param {Array} newFront 新生成的前区数组
 * @param {string} newBack 新生成的后区号码
 * @param {Array} historicalData 历史数据
 */
const isDuplicate = (newFront, newBack, historicalData) => {
  return historicalData.some(item => {
    // 前区数组完全匹配（升序对比）
    const frontMatch = JSON.stringify(item.front) === JSON.stringify(newFront);
    // 后区号码匹配
    const backMatch = item.back === newBack;
    return frontMatch && backMatch;
  });
};

/**
 * 生成过滤后的双色球号码
 * @param {Array} historicalData 历史数据
 */
const generateFilteredLotto = (historicalData) => {
  let frontArea, backArea;
  let attempts = 0;
  do {
    attempts++;
    // 生成前区6个不重复、升序号码
    frontArea = [];
    while (frontArea.length < 6) {
      const num = getRandomNum(1, 33);
      if (!frontArea.includes(num)) frontArea.push(num);
    }
    frontArea.sort((a, b) => a - b);
    
    // 生成后区1个号码（蓝球 1-16）
    backArea = getRandomNum(1, 16);
    
    // 补零格式化
    frontArea = frontArea.map(n => n.toString().padStart(2, '0'));
    backArea = backArea.toString().padStart(2, '0');
    
    // 防止死循环（虽然概率极低）
    if (attempts > 10000) {
      console.warn('⚠️ 尝试次数过多，可能数据覆盖范围过大');
      break;
    }
    // 去重循环，直到生成未出现过的号码
  } while (isDuplicate(frontArea, backArea, historicalData));

  return { frontArea, backArea };
};

// ===================== 核心爬取逻辑 =====================
/**
 * 爬取单页数据
 * @param {number} pageNo 页码
 * @returns {Promise<{data: Array, total: number}>} 格式化数据+总期数
 */
const fetchPage = async (pageNo) => {
  try {
    const res = await axios.get(CONFIG.API_URL, {
      params: { ...CONFIG.REQ_PARAMS, pageNo },
      headers: CONFIG.HEADERS,
      timeout: 10000
    });

    // 接口返回成功判断
    if (res.data.state !== 0 || res.data.message !== '查询成功') {
      throw new Error(`接口返回异常：${res.data.message || '未知错误'}`);
    }

    // 格式化当前页数据
    const formattedData = res.data.result.map(formatItem);
    return {
      data: formattedData,
      total: res.data.total || 0 // 总期数（接口返回的total字段）
    };
  } catch (err) {
    console.error(`❌ 第${pageNo}页爬取失败：`, err.message);
    return { data: [], total: 0 };
  }
};

/**
 * 全量爬取双色球历史数据并生成新号码
 */
const crawlAllData = async () => {
  let allData = [];
  let pageNo = 1;
  let totalCount = 0;

  console.log('🚀 开始爬取双色球历史数据...');

  // 第一步：爬取第一页，获取总期数
  const firstPage = await fetchPage(pageNo);
  if (firstPage.data.length === 0) {
    console.error('❌ 第一页数据获取失败，终止爬取');
    return;
  }
  allData = [...allData, ...firstPage.data];
  totalCount = firstPage.total;
  console.log(`✅ 第${pageNo}页爬取完成，新增${firstPage.data.length}条，累计${allData.length}条（总${totalCount}条）`);

  // 第二步：计算总页数，爬取剩余页面
  const totalPages = Math.ceil(totalCount / CONFIG.REQ_PARAMS.pageSize);
  if (totalPages <= 1) {
    console.log('📌 仅1页数据，无需继续爬取');
  } else {
    for (pageNo = 2; pageNo <= totalPages; pageNo++) {
      // 间隔请求，防封
      await new Promise(resolve => setTimeout(resolve, CONFIG.REQUEST_INTERVAL));
      const pageData = await fetchPage(pageNo);
      allData = [...allData, ...pageData.data];
      console.log(`✅ 第${pageNo}页爬取完成，新增${pageData.data.length}条，累计${allData.length}条`);
    }
  }

  // 第三步：去重+排序+保存
  // 1. 按期号去重（避免重复数据）
  const uniqueData = Array.from(new Map(allData.map(item => [item.issue, item])).values());
  // 2. 按开奖日期升序排列（从旧到新）
  uniqueData.sort((a, b) => new Date(a.date) - new Date(b.date));
  // 3. 保存到文件
  await fs.ensureDir('./data');
  await fs.writeJSON(CONFIG.OUTPUT_FILE, uniqueData, { spaces: 2 });

  // 爬取完成统计
  console.log(`\n🎉 爬取完成！`);
  console.log(`📊 最终数据量：${uniqueData.length}期`);
  console.log(`💾 保存路径：${CONFIG.OUTPUT_FILE}`);
  console.log(`📅 时间范围：${uniqueData[0]?.date} ~ ${uniqueData[uniqueData.length - 1]?.date}`);
  console.log(`💰 最新奖池：${uniqueData[uniqueData.length - 1]?.poolMoney || '未知'}`);

  // 第四步：生成推荐号码
  console.log('\n🎲 正在根据历史数据生成排除重复的推荐号码...');
  const lotto = generateFilteredLotto(uniqueData);
  console.log(`✨ 推荐号码：`);
  console.log(`🔴 前区：${lotto.frontArea.join(' ')} | 🔵 后区：${lotto.backArea}`);
};

// 执行爬取
crawlAllData();