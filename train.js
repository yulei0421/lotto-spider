import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs-extra';
import path from 'path';

async function train() {
    // 1. 加载数据
    const dataPath = path.resolve('./data/ssq-full-data.json');
    if (!await fs.pathExists(dataPath)) {
        console.error('数据文件不存在:', dataPath);
        return;
    }
    
    const data = await fs.readJson(dataPath);
    console.log(`加载了 ${data.length} 条数据`);

    // 2. 增强型特征工程与标准化 (Z-Score)
    const LOOKBACK = 12; // 扩展窗口到 12 期
    const inputSequences = [];
    const outputTargets = [];

    // 计算全局统计量用于 Z-Score 标准化
    const allNumericData = data.flatMap(d => [...d.front.map(Number), Number(d.back)]);
    const mean = allNumericData.reduce((a, b) => a + b, 0) / allNumericData.length;
    const std = Math.sqrt(allNumericData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allNumericData.length);
    const zScore = (v) => (v - mean) / (std || 1);

    // 预计算全局频率
    const globalFreq = { red: Array(34).fill(0), blue: Array(17).fill(0) };
    data.forEach(d => {
        d.front.forEach(n => globalFreq.red[Number(n)]++);
        globalFreq.blue[Number(d.back)]++;
    });

    for (let i = LOOKBACK; i < data.length - 1; i++) {
        const windowData = data.slice(i - LOOKBACK, i);
        const next = data[i + 1];
        let windowVector = [];
        let currentOmit = { red: Array(34).fill(0), blue: Array(17).fill(0) };

        windowData.forEach(current => {
            for(let j=1; j<=33; j++) currentOmit.red[j]++;
            for(let j=1; j<=16; j++) currentOmit.blue[j]++;
            current.front.forEach(n => currentOmit.red[Number(n)] = 0);
            currentOmit.blue[Number(current.back)] = 0;

            // 补充特征：极差、均值偏离
            const redInts = current.front.map(Number);
            const rangeRed = (Math.max(...redInts) - Math.min(...redInts)) / 32;
            const avgDev = (redInts.reduce((a, b) => a + Math.abs(b - 17), 0) / 6) / 16;

            const base = [...redInts.map(zScore), zScore(Number(current.back))];
            const freq = [...redInts.map(n => globalFreq.red[n] / data.length), globalFreq.blue[Number(current.back)] / data.length];
            const omit = [...redInts.map(n => Math.min(currentOmit.red[n] / 50, 1)), Math.min(currentOmit.blue[Number(current.back)] / 50, 1)];
            
            windowVector.push(...base, ...freq, ...omit, rangeRed, avgDev);
        });
        inputSequences.push(windowVector);
        outputTargets.push([...next.front.map(n => Number(n) / 33), Number(next.back) / 16]);
    }

    // 3. 按时间顺序划分验证集 (避免未来信息泄露)
    const splitIdx = Math.floor(inputSequences.length * 0.85);
    const trainXs = tf.tensor2d(inputSequences.slice(0, splitIdx));
    const trainYs = tf.tensor2d(outputTargets.slice(0, splitIdx));
    const valXs = tf.tensor2d(inputSequences.slice(splitIdx));
    const valYs = tf.tensor2d(outputTargets.slice(splitIdx));

    const featureSize = inputSequences[0].length;
    console.log(`[工程层] 特征维度: ${featureSize}, 训练集: ${splitIdx}, 验证集: ${inputSequences.length - splitIdx}`);

    // 4. 构建残差结构的深度模型 (Functional API 以支持残差连接)
    const input = tf.input({ shape: [featureSize] });
    
    // Block 1
    let x = tf.layers.dense({ units: 512, kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 }) }).apply(input);
    x = tf.layers.leakyReLU({ alpha: 0.1 }).apply(x);
    x = tf.layers.batchNormalization().apply(x);
    const res1 = x; // 残差点

    // Block 2
    x = tf.layers.dense({ units: 512, kernelRegularizer: tf.regularizers.l2({ l2: 1e-4 }) }).apply(x);
    x = tf.layers.leakyReLU({ alpha: 0.1 }).apply(x);
    x = tf.layers.batchNormalization().apply(x);
    x = tf.layers.add().apply([x, res1]); // 残差连接

    // Block 3
    x = tf.layers.dense({ units: 256 }).apply(x);
    x = tf.layers.leakyReLU({ alpha: 0.1 }).apply(x);
    x = tf.layers.dropout({ rate: 0.5 }).apply(x);

    const output = tf.layers.dense({ units: 7, activation: 'sigmoid' }).apply(x);
    const model = tf.model({ inputs: input, outputs: output });

    model.compile({
        optimizer: tf.train.adam(0.0005),
        loss: 'meanSquaredError'
    });

    // 5. 训练层：学习率衰减
    console.log('[训练层] 正在进行残差网络深度自适应训练...');
    
    // 彻底移除内置的 EarlyStopping 插件，改用手动逻辑防止 callback.setParams 报错
    await model.fit(trainXs, trainYs, {
        epochs: 600,
        batchSize: 64,
        validationData: [valXs, valYs],
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                // 自定义学习率衰减
                if (epoch > 0 && epoch % 100 === 0) {
                    model.optimizer.learningRate *= 0.5;
                    console.log(`\n[自适应] 学习率衰减至: ${model.optimizer.learningRate.toFixed(6)}`);
                }
                if (epoch % 20 === 0) {
                    console.log(`Epoch ${epoch}: loss=${logs.loss.toFixed(6)}, val_loss=${logs.val_loss.toFixed(6)}`);
                }
            }
        }
    });

    // 6. 内存管理与保存
    const modelDir = path.resolve('./public/model');
    await fs.ensureDir(modelDir);
    await model.save(`file://${modelDir}`);
    console.log(`[工程层] 最佳模型已导出至: ${modelDir}`);
    
    tf.dispose([trainXs, trainYs, valXs, valYs, model]);
}

// 分段错误处理
train().catch(err => {
    console.error('[核心错误]', err.message);
    process.exit(1);
});
