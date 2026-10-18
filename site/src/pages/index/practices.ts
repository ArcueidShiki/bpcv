import type { Bi } from '../../shared/types';

/** Google HTML/CSS and JavaScript style guides, cut to one line each. */
export interface Practice { id: number; cat: 'HTML' | 'CSS' | 'JavaScript'; name: Bi; rule: Bi }

export const PRACTICES: Practice[] = [
  { id: 1, cat: 'HTML', name: { en: 'Multimedia fallback', zh: '多媒体替代内容' },
    rule: { en: 'Give every image alt text and every video captions — like a caption under a newspaper photo.', zh: '图片写 alt，视频配字幕——就像报纸照片下的图注。' } },
  { id: 2, cat: 'HTML', name: { en: 'Semantics', zh: '语义化' },
    rule: { en: 'Use each element for its purpose: h1 for headings, p for paragraphs, a for links.', zh: '元素按用途使用：标题用 h1，段落用 p，链接用 a。' } },
  { id: 3, cat: 'HTML', name: { en: 'No type attributes', zh: '省略 type 属性' },
    rule: { en: 'Omit type on <link rel="stylesheet"> and <script>; the default is already right.', zh: '样式表和脚本不写 type，默认值已经正确。' } },
  { id: 4, cat: 'HTML', name: { en: 'Few id attributes', zh: '少用 id' },
    rule: { en: 'Prefer classes for styling and data- attributes for scripts; if you need an id, hyphenate it: user-profile.', zh: '样式用 class，脚本用 data- 属性；必须用 id 时带连字符，如 user-profile。' } },
  { id: 5, cat: 'HTML', name: { en: 'Double quotes', zh: '双引号' },
    rule: { en: 'Quote attribute values with double quotes: class="card".', zh: '属性值用双引号：class="card"。' } },
  { id: 6, cat: 'CSS', name: { en: 'Meaningful class names', zh: '有意义的类名' },
    rule: { en: 'Name classes by purpose, not looks: .error, not .red-text.', zh: '类名表达用途而非外观：用 .error，不用 .red-text。' } },
  { id: 7, cat: 'CSS', name: { en: 'Hyphen delimiters', zh: '连字符分隔' },
    rule: { en: 'Separate words with hyphens: .video-player, not .videoPlayer.', zh: '单词之间用连字符：.video-player，而不是 .videoPlayer。' } },
  { id: 8, cat: 'CSS', name: { en: 'Prefixes', zh: '命名前缀' },
    rule: { en: 'In large or embedded code, prefix classes (.bp-card) so they cannot clash — a namespace.', zh: '大型或嵌入式代码给类名加前缀（.bp-card），相当于命名空间，避免冲突。' } },
  { id: 9, cat: 'CSS', name: { en: 'No type-qualified classes', zh: '不用元素限定类名' },
    rule: { en: 'Write .error, not ul.error — simpler and faster to match.', zh: '写 .error，不写 ul.error——更简单，匹配也更快。' } },
  { id: 10, cat: 'CSS', name: { en: 'No ID selectors', zh: '不用 ID 选择器' },
    rule: { en: 'IDs are too specific to override; style with classes.', zh: 'ID 的优先级太高，难以覆盖；用 class 写样式。' } },
  { id: 11, cat: 'JavaScript', name: { en: 'File names', zh: '文件命名' },
    rule: { en: 'All lowercase, with _ or - only: order_book.js.', zh: '全部小写，只用 _ 或 -：order_book.js。' } },
  { id: 12, cat: 'JavaScript', name: { en: 'Imports', zh: '导入' },
    rule: { en: 'Use ES modules, one import per line, with the .js extension.', zh: '使用 ES 模块，每行一个 import，路径带 .js 后缀。' } },
  { id: 13, cat: 'JavaScript', name: { en: 'Exports', zh: '导出' },
    rule: { en: 'Use named exports, not default exports, so names stay consistent across files.', zh: '用具名导出，不用默认导出，保证各文件里名字一致。' } },
  { id: 14, cat: 'JavaScript', name: { en: '80-column limit', zh: '每行 80 列' },
    rule: { en: 'Wrap lines at 80 characters so diffs fit side by side.', zh: '每行不超过 80 个字符，方便并排对比代码差异。' } },
  { id: 15, cat: 'JavaScript', name: { en: 'Naming', zh: '命名' },
    rule: { en: 'lowerCamelCase for variables, UpperCamelCase for classes, CONSTANT_CASE for constants.', zh: '变量用 lowerCamelCase，类用 UpperCamelCase，常量用 CONSTANT_CASE。' } },
  { id: 16, cat: 'HTML', name: { en: 'Formatting', zh: '格式化' },
    rule: { en: 'Put every block element on its own line and indent its children.', zh: '每个块级元素独占一行，子元素缩进。' } },
  { id: 17, cat: 'CSS', name: { en: '0 without units', zh: '0 不带单位' },
    rule: { en: 'Write margin: 0, not margin: 0px.', zh: '写 margin: 0，而不是 margin: 0px。' } },
  { id: 18, cat: 'JavaScript', name: { en: 'Closures', zh: '嵌套函数与闭包' },
    rule: { en: 'An inner function remembers the variables around it — like a backpack it carries out of the room.', zh: '内部函数会记住外层变量——就像离开房间时背走的一个背包。' } },
];

export const PASS_MARK = 14;
