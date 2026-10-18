import type { Bi } from '../../shared/types';

/** One maths topic: a principle, one finance example, a line of maths. */
export interface MathSection {
  id: string;
  nav: Bi;
  title: Bi;
  principle: Bi;
  example: Bi;
  formula: string;
}

export const TITLE: Bi = { en: 'Math for Finance', zh: '金融数学' };
export const SUBTITLE: Bi = {
  en: 'Ten pieces of maths, each drawn live. Drag the sliders and watch which term moves.',
  zh: '十块数学，每块都画成活的图。拖动滑块，看哪一项在动。',
};
export const EXAMPLE: Bi = { en: 'In finance', zh: '金融里' };

const s = (id: string, nav: Bi, title: Bi, principle: Bi, example: Bi, formula: string): MathSection =>
  ({ id, nav, title, principle, example, formula });

export const SECTIONS: Record<string, MathSection> = {
  deriv: s('deriv', { en: 'Derivatives', zh: '导数' },
    { en: 'First and second derivatives', zh: '一阶导与二阶导' },
    { en: 'The first derivative is the slope; the second is how fast that slope changes.',
      zh: '一阶导是斜率；二阶导是斜率变化的快慢。' },
    { en: 'Delta is the first derivative of an option price in spot, gamma the second — like speed and acceleration.',
      zh: 'Delta 是期权价格对股价的一阶导，Gamma 是二阶导——就像速度和加速度。' },
    "f(x) = x³ − 3x    f′(x) = 3x² − 3    f″(x) = 6x"),
  calc: s('calc', { en: 'Calculus', zh: '微积分' },
    { en: 'The limit and the integral', zh: '极限与积分' },
    { en: 'A derivative is a slope with the step shrunk to zero; an integral is a sum with the slices made thin.',
      zh: '导数是步长缩到零的斜率；积分是切片无限变薄的求和。' },
    { en: 'The area under the normal density from −3 to 1 is a probability: N(1) − N(−3) ≈ 0.84.',
      zh: '正态密度在 −3 到 1 之间的面积就是一个概率：N(1) − N(−3) ≈ 0.84。' },
    "f′(x) = lim h→0 [f(x+h) − f(x)] / h    ∫ f dx = lim Σ f(xᵢ) Δx"),
  shapes: s('shapes', { en: 'Shapes', zh: '函数形态' },
    { en: 'Eight shapes that cover most of finance', zh: '覆盖金融大半的八种形态' },
    { en: 'Recognise these curves on sight and you know what they imply for growth, decay, saturation and tails.',
      zh: '一眼认出这些曲线，就知道它们对增长、衰减、饱和与尾部意味着什么。' },
    { en: 'Delta against spot is an S-curve; real return tails follow a power law, not a Gaussian.',
      zh: 'Delta 对股价是一条 S 曲线；真实收益的尾部服从幂律，而不是高斯。' },
    ''),
  taylor: s('taylor', { en: 'Taylor', zh: '泰勒展开' },
    { en: 'Any smooth curve is a polynomial nearby', zh: '光滑曲线在局部就是多项式' },
    { en: 'Match the value, slope and curvature at one point and you get a good copy near it, and a poor one far away.',
      zh: '在一点上对齐函数值、斜率和弯曲度，附近就近似得很好，离远了就不行。' },
    { en: 'A hedge built from delta and gamma works for a $1 move and breaks for a $20 move.',
      zh: '靠 Delta 和 Gamma 建的对冲，对 1 美元的波动有效，对 20 美元的波动就会失效。' },
    "ΔV ≈ Δ·dS + ½Γ·dS² + 𝒱·dσ + Θ·dt"),
  linalg: s('linalg', { en: 'Linear algebra', zh: '线性代数' },
    { en: 'A matrix moves space', zh: '矩阵搬动空间' },
    { en: 'A 2×2 matrix maps the plane onto itself; the determinant scales area, eigenvectors keep their direction.',
      zh: '2×2 矩阵把平面映到自身；行列式是面积倍数，特征向量方向不变。' },
    { en: 'Portfolio variance is one matrix product — lower correlation bends risk below the straight line.',
      zh: '组合方差就是一个矩阵乘积——相关性越低，风险曲线越往直线下方弯。' },
    "σₚ² = wᵀΣw = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂"),
  trig: s('trig', { en: 'Trigonometry', zh: '三角函数' },
    { en: 'Circles unrolled into waves', zh: '把圆展开成波' },
    { en: 'Sine and cosine are the coordinates of a point going round a circle, plotted against the angle.',
      zh: '正弦和余弦是绕圆运动的点的坐标，对角度作图。' },
    { en: 'Seasonality and cycles in prices are built from these waves.',
      zh: '价格里的季节性和周期，就是用这些波搭出来的。' },
    "sin²θ + cos²θ = 1    e^{iθ} = cos θ + i·sin θ"),
  fourier: s('fourier', { en: 'Fourier', zh: '傅立叶' },
    { en: 'Every signal is a stack of sine waves', zh: '任何信号都是一叠正弦波' },
    { en: 'Any repeating signal, even one with corners, is a sum of sines at multiples of one base frequency.',
      zh: '任何重复信号，哪怕带尖角，都是基频整数倍正弦波之和。' },
    { en: 'FFT pricing values a whole ladder of strikes in one pass.',
      zh: 'FFT 定价一次就能算完整条行权价阶梯。' },
    "f(x) ≈ Σₙ bₙ·sin(nx)"),
  prob: s('prob', { en: 'Probability', zh: '概率' },
    { en: 'Normal, lognormal and the random walk', zh: '正态、对数正态与随机游走' },
    { en: 'If log returns are normal, prices are lognormal: never below zero and skewed to the right.',
      zh: '对数收益服从正态，价格就服从对数正态：不会低于零，并且右偏。' },
    { en: 'The “expected move” on an options screen is ±1σ of this distribution.',
      zh: '期权界面上的“预期波动”就是这个分布的 ±1σ。' },
    "ln(S_T/S₀) ~ N(−½σ²T, σ²T)    dS = μS dt + σS dW"),
  kelly: s('kelly', { en: 'Kelly', zh: '凯利公式' },
    { en: 'How much to bet', zh: '下多大注' },
    { en: 'With an edge there is one bet size that maximises long-run growth; betting more grows slower and can still ruin you.',
      zh: '有优势时存在一个让长期增长最快的仓位；下得更多反而更慢，甚至会破产。' },
    { en: 'Win 55% at even odds: Kelly says risk 10% per bet; most traders use half that.',
      zh: '胜率 55%、赔率 1:1：凯利说每次押 10%；多数交易者只用一半。' },
    "g(f) = p·ln(1+fb) + q·ln(1−f)    f* = (pb − q) / b"),
  applied: s('applied', { en: 'Map', zh: '对照' },
    { en: 'Which maths does which job', zh: '哪块数学干哪份活' },
    { en: 'Every tool above becomes one object in a trading model.',
      zh: '上面每个工具，都对应交易模型里的一个对象。' },
    { en: 'Delta is a derivative, a risk report is a Taylor expansion, position size is Kelly.',
      zh: 'Delta 是导数，风险报告是泰勒展开，仓位大小是凯利。' },
    ''),
};

export const ORDER = ['deriv', 'calc', 'shapes', 'taylor', 'linalg', 'trig', 'fourier', 'prob', 'kelly', 'applied'];

export const APPLIED: { tool: Bi; object: Bi }[] = [
  { tool: { en: 'First derivative', zh: '一阶导数' }, object: { en: 'Delta, duration, beta', zh: 'Delta、久期、贝塔' } },
  { tool: { en: 'Second derivative', zh: '二阶导数' }, object: { en: 'Gamma, convexity', zh: 'Gamma、凸性' } },
  { tool: { en: 'Taylor expansion', zh: '泰勒展开' }, object: { en: 'Greeks P&L attribution', zh: '希腊字母盈亏归因' } },
  { tool: { en: 'Integration', zh: '积分' }, object: { en: 'N(d₁), N(d₂), expected payoff', zh: 'N(d₁)、N(d₂)、期望收益' } },
  { tool: { en: 'Linear algebra', zh: '线性代数' }, object: { en: 'Covariance matrix, factor models', zh: '协方差矩阵、因子模型' } },
  { tool: { en: 'Trigonometry', zh: '三角函数' }, object: { en: 'Characteristic functions', zh: '特征函数' } },
  { tool: { en: 'Fourier transform', zh: '傅立叶变换' }, object: { en: 'FFT option pricing', zh: 'FFT 期权定价' } },
  { tool: { en: 'Probability', zh: '概率' }, object: { en: 'Lognormal spot, expected move', zh: '对数正态价格、预期波动' } },
  { tool: { en: 'Kelly criterion', zh: '凯利公式' }, object: { en: 'Position size', zh: '仓位大小' } },
];
