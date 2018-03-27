import fecha from 'fecha'
import { NO_TAG_NAME, NO_CATEGORY_SLUG } from '../constants'


export class Article {
  constructor(obj, store) {
    Object.assign(this, obj)
  }
  getCategorySlug() {
    return this.parent || NO_CATEGORY_SLUG
  }
  getRelative() {
    const { parent, slug } = this
    return (parent || '-') + '/' + slug
  }
  matchByRelative(relative) {
    const [ categorySlug, slug ] = relative.split('/')
    return this.getCategorySlug() === categorySlug && this.slug === slug 
  }
  getHref() {
    return '/' + this.getRelative()
  }
  getTags() {
    if (this.tags.length > 0) {
      return this.tags
    }
    return [ NO_TAG_NAME ]
  }
  copy() {
    return new Article(JSON.parse(JSON.stringify(this)))
  }
  getDigest() {
    if (this.digest) {
      return this.digest
    }
    const threshold = 120
    const base = this.content.substring(0, 200)
    const tmp = base.replace(/#|`|:|-|\||\*|_/g, '').substring(0, threshold)
    return (tmp.length < threshold) ? tmp : (tmp + '...')
  }
  matchParent(parent) {
    if (parent === '-' && this.parent === null) {
      return true
    }
    return this.parent === parent
  }
  getCategory() {
    const slug = this.parent || NO_CATEGORY_SLUG
    return this.constructor.store.getters['category/getCategoryBySlug'](slug)
  }
  equals(another) {
    return this.parent === another.parent && this.slug === another.slug 
  }
  getSiblings() {
    if (this.special) {
      return [null, null]
    }
    const map = this.constructor.store.getters['article/articleMapKeyByParent']
    const siblings = map[this.parent]
    let prev = null
    let next = null
    let matched = false
    for (const a of siblings) {
      if (matched) {
        next = a
        break
      }
      if (this.equals(a)) {
        matched = true
        continue
      }
      prev = a
    }
    return [prev, next]
  }

  compareByDate(that) {
    let diff
    const a = fecha.format(new Date(this.date), 'YYYY-MM-DD')
    const b = fecha.format(new Date(that.date), 'YYYY-MM-DD')
    diff = b.localeCompare(a)
    if (diff !== 0) {
      return diff
    }
    diff = that.priority - this.priority
    if (diff !== 0) {
      if (this.priority === 0) {
        return 1
      }
      if (that.priority === 0) {
        return -1
      }
      return diff
    }
    return this.slug.localeCompare(that.slug)
  }

  compare(that) {
    let diff
    diff = this.priority - that.priority
    if (diff !== 0) {
      if (this.priority === 0) {
        return 1
      }
      if (that.priority === 0) {
        return -1
      }
      return diff
    }
    const a = fecha.format(new Date(this.date), 'YYYY-MM-DD')
    const b = fecha.format(new Date(that.date), 'YYYY-MM-DD')
    diff = b.localeCompare(a)
    if (diff !== 0) {
      return diff
    }
    return this.slug.localeCompare(that.slug)
  }
}


export class Category {
  constructor(obj) {
    Object.assign(this, obj)
  }
  getValue() {
    return this.slug === '-' ? null : this.slug
  }
  getArticles() {
    const map = this.constructor.store.getters['article/articleMapKeyByParent']
    return map[this.getValue()] || []
  }
}
