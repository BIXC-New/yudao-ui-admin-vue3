// 商城语义色：所有页面通过同一组变量消费，不按主题名称分别写组件样式。
const colors = {
  red: '#d10019',
  orange: '#f37b1d',
  gold: '#fbbd08',
  green: '#8dc63f',
  cyan: '#1cbbb4',
  blue: '#0081ff',
  purple: '#6739b6',
  brightRed: '#e54d42',
  forestGreen: '#39b54a',
  mauve: '#9c26b0',
  pink: '#e03997',
  brown: '#a5673f',
  grey: '#8799a3',
  gray: '#aaaaaa',
  black: '#333333',
  blackGold: '#d6b982'
}

function rgb(color) {
  return [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16))
}

function luminance(color) {
  const values = rgb(color).map((value) => {
    value /= 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}

function contrast(first, second) {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function blend(first, second, amount) {
  return '#' + rgb(first).map((value, index) =>
    Math.round(value + (rgb(second)[index] - value) * amount).toString(16).padStart(2, '0'),
  ).join('')
}

function readableAccent(primary, background) {
  let color = primary
  const target = luminance(background) > 0.5 ? '#000000' : '#ffffff'
  for (let index = 0; index < 12 && contrast(color, background) < 4.5; index++) {
    color = blend(color, target, 0.16)
  }
  return color
}

export function getThemeStyles(theme, config = {}, backgroundColor = '') {
  const primary = /^#[0-9a-f]{6}$/i.test(config.primaryColor || '')
    ? config.primaryColor
    : colors[theme] || colors.orange
  const dark =
    config.mode === 'dark' ||
    (config.mode !== 'light' &&
      (theme === 'blackGold' ||
        (/^#[0-9a-f]{6}$/i.test(backgroundColor) && luminance(backgroundColor) < 0.2)))
  const surface = dark ? '#24211e' : '#ffffff'
  const text = dark ? '#f3eee5' : '#303030'
  const muted = dark ? '#302c27' : '#f1f1f1'
  const primaryText =
    contrast(primary, '#ffffff') >= contrast(primary, '#211c14') ? '#ffffff' : '#211c14'
  // 金黄等浅色在白底上改用更深的同色系文字，按钮仍保留原主题色。
  const accentText = readableAccent(primary, surface)
  const promoBackground = blend(surface, primary, dark ? 0.22 : 0.12)
  const promoText = readableAccent(primary, promoBackground)
  const soft = `rgba(${rgb(primary).join(',')},0.14)`
  return {
    '--ui-BG': surface,
    '--ui-BG-1': dark ? '#171614' : '#f6f6f6',
    '--ui-BG-2': muted,
    '--ui-BG-3': dark ? '#38332d' : '#e8e8e8',
    '--ui-BG-4': dark ? '#433d34' : '#e0e0e0',
    '--ui-TC': text,
    '--ui-TC-1': dark ? '#ded5c8' : '#525252',
    '--ui-TC-2': dark ? '#bcb2a4' : '#666666',
    '--ui-TC-3': dark ? '#b4aa9b' : '#737373',
    '--ui-TC-4': dark ? '#a99f91' : '#737373',
    '--ui-Placeholder': dark ? '#b4aa9b' : '#737373',
    '--ui-Input-BG': muted,
    '--ui-Input-Border': dark ? '#817565' : '#858585',
    '--ui-Disabled-TC': dark ? '#a99f91' : '#666666',
    '--ui-Error': dark ? '#ff9a91' : '#b42318',
    '--ui-BG-Main': primary,
    '--ui-BG-Main-gradient': primary,
    '--ui-BG-Main-TC': primaryText,
    '--ui-BG-Main-light': soft,
    '--ui-BG-Main-opacity-1': soft,
    '--ui-BG-Main-opacity-4': soft,
    '--ui-BG-Main-tag': soft,
    '--ui-Border': dark ? '#443d33' : '#dddddd',
    '--ui-Line': dark ? '#443d33' : '#dddddd',
    '--ui-Blur': surface,
    '--shop-accent-text': accentText,
    '--shop-price': accentText,
    '--shop-promo-bg': promoBackground,
    '--shop-promo-text': promoText,
    '--shop-action-text': primaryText,
    '--nav-surface': surface,
    '--nav-action-bg': muted,
    '--nav-action-color': accentText,
    '--lux-radius': '24rpx',
    '--lux-space': '32rpx',
    '--page-gutter': '32rpx',
    '--card-padding': '28rpx',
    '--section-gap': '48rpx',
    '--body-font-size': '30rpx',
    '--body-line-height': '1.55'
  }
}

/** 装修仍保存原始属性；开启跟随主题时，将颜色属性映射到语义变量。 */
export function themePage(page, followTheme = true) {
  if (!page || !followTheme) return page
  const mapColors = (value, key = '') => {
    if (Array.isArray(value)) return value.map((item) => mapColors(item, key))
    if (!value || typeof value !== 'object') return value
    const result = { ...value }
    for (const [name, item] of Object.entries(result)) {
      if (['bgColor', 'backgroundColor'].includes(name)) result[name] = 'var(--ui-BG)'
      else if (['bgBeginColor', 'bgEndColor'].includes(name)) result[name] = 'var(--ui-BG-Main)'
      else if (['titleColor', 'textColor'].includes(name)) result[name] = 'var(--ui-TC)'
      else if (['subtitleColor', 'descriptionColor'].includes(name)) result[name] = 'var(--ui-TC-2)'
      else if (name === 'color' && typeof item === 'string')
        result[name] = key === 'price' ? 'var(--shop-accent-text)' : 'var(--ui-TC)'
      else result[name] = mapColors(item, name)
    }
    return result
  }
  const result = mapColors(page)
  result.page = { ...result.page, backgroundColor: 'var(--ui-BG-1)' }
  for (const component of result.components || []) {
    const property = component.property
    if (property?.style) {
      const surface = [
        'MenuGrid',
        'MenuList',
        'UserOrder',
        'UserWallet',
        'UserCoupon',
        'NoticeBar'
      ].includes(component.id)
      property.style.bgColor = surface ? 'var(--ui-BG)' : 'var(--ui-BG-1)'
    }
    if (component.id === 'SearchBar') property.backgroundColor = 'var(--ui-BG-2)'
  }
  return result
}

// 本地预置线性图标使用字体着色；用户上传的图片保留原素材。
export function getThemeIcon(url = '') {
  const match = url.match(/\/static\/theme\/nav-(\d)-/)
  if (match) return ['home', 'list', 'cart', 'person'][Number(match[1])]
  const legacy = url.match(/\/static\/images\/([1-4])-(?:001|002)\.png/)
  return legacy ? ['home', 'list', 'cart', 'person'][Number(legacy[1]) - 1] : ''
}
