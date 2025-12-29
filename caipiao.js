/**
 * 1. 生成指定范围随机整数（含边界）
 */
const getRandomNum = (min, max) => Math.floor(Math.random()*(max - min + 1)) + min;

import historicalData from './data/ssq-full-data.json' with { type: 'json' };
/**
 * 2. 模拟/替换为真实历史数据（示例10期，建议从官方渠道获取后替换）
 * 格式：{ front: [前区6个升序号码], back: 后区号码 }
 */


/**
 * 3. 检查号码是否已在历史数据中出现
 */
const isDuplicate = (newFront, newBack) => {
  return historicalData.some(item => {
    // 前区数组完全匹配（升序对比）
    const frontMatch = JSON.stringify(item.front) === JSON.stringify(newFront);
    // 后区号码匹配
    const backMatch = item.back === newBack;
    return frontMatch && backMatch;
  });
};

/**
 * 4. 生成过滤后的双色球号码
 */
const generateFilteredLotto = () => {
  let frontArea, backArea;
  do {
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
    // 去重循环，直到生成未出现过的号码
  } while (isDuplicate(frontArea, backArea));

  return { frontArea, backArea };
};

// 执行生成并输出
const lotto = generateFilteredLotto();
console.log(`前区：${lotto.frontArea.join(' ')} | 后区：${lotto.backArea}`);
