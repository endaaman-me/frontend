<style scoped lang="scss">
@import "../css/variables";

.sidebar-root {
  background-color: $sidebar-bg;
  color: $white-ter;

  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;

  overflow-y: scroll;
}

.sidebar-main {
  padding: 16px;
  flex-grow: 1;

  h2 {
    line-height: 16px;
    padding: 8px 0;
    margin: 24px 0 16px;

    font-size: 16px;
    border-bottom: solid 2px $white-ter;
  }

  .category-title {
    user-select: none;
    margin: 16px 0 8px;
    & > a {
      display: block;
      text-decoration: none;
      color: inherit;
      margin-bottom: 2px;
      &:hover {
        font-weight: bold;
      }
    }
  }

  .articles-by-category {
    transition: max-height .1s;
    max-height: 0;
    overflow-y: auto;

    &.articles-by-category-open {
      height: auto;
      max-height: 400px;
    }

    ul {
      position: relative;
      margin-left: 0px;
      margin-right: 0;
      padding: 1px 0;

      &:before {
        content: '';
        position: absolute;
        left: 6px;
        width: 1px;
        bottom: 0;
        top: 8px;
        background-color: $grey;
      }

      li {
        position: relative;
        margin: 8px 16px;
        padding: 2px 0;
        a {
          display: block;
          font-size: $size-6;
          color: $grey;
          .date {
            display: block;
            font-size: $size-7;
          }
        }
        &:before {
          position: absolute;
          content: '';
          left: -10px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: $grey-light;
        }

        &:hover, &.is-active {
          a {
            color: $white;
          }
          &:before {
            background-color: $primary;
          }
        }
      }
    }
  }

  .tag.is-inversed {
    margin-top: auto;

    background-color: transparent;
    border-color: $white-ter;
    color: $white-ter;
    &:hover {
      background-color: $white-ter;
      color: $sidebar-bg;
    }
  }


  .special-title {
    user-select: none;
    margin-top: 16px;
    & > a {
      display: block;
      text-decoration: none;
      color: inherit;
      &:hover {
        font-weight: bold;
      }
    }
  }
}

// .sidebar-footer-wrapper  {
//   display: flex;
//   flex-direction: column;
// }

.sidebar-footer  {
  width: 100%;
  /* margin-top: auto; */

  padding: 48px 16px 12px;
  font-size: $size-7;
  background-color: $sidebar-bg;

  .footer-right-text {
    float: right;
    margin-left: 8px;
  }

  .footer-left-text {
    float: left;
    margin-right: 16px;
    font-style: italic;
  }

  .social-links {
    margin: 12px 0;
    overflow: hidden;
    li {
      margin-right: 24px;
      float: left;
    }
  }

  .social-link {
    $size: 24px;
    height: $size;
    line-height: $size;
    text-align: center;
    font-size: $size-2;
    color: $grey;
    &:hover {
      color: $white-ter;
    }
  }
}

.is-primay {
  color: $primary;
}

</style>

<template lang="pug">
.sidebar-root
  .sidebar-main
    my-logo
    h2 Category
    .category-title(v-for="c in categoryItems" v-if="c.category.getArticles().length > 0" :key="c.slug")
      a.nodeco-inline(@click="toggleArticlesList(c)")
        i.mdi.is-primay(:class="{ 'mdi-chevron-right': !c.isActive, 'mdi-chevron-down': c.isActive }")
        span(:class="{ 'has-text-weight-bold': c.isActive }") {{ c.name }}

      .articles-by-category(:class="{'articles-by-category-open' : c.isActive}", ref="articlesContainers")
        ul
          li(
            v-for="a in c.category.getArticles()",
            :class="{ 'is-active': a.getHref() === $route.path }")
            nuxt-link(:to="a.getHref()")
              span.date {{ a.date }}
              span {{ a.title }}
              span.icon.has-text-danger(v-if="a.private")
                i.mdi.mdi-lock

    h2 Tags
    .tags
      nuxt-link.tag.is-white(
        v-for="tag in tagItems",
        :to="tag.isActive ? '/' : '/?tag=' + tag.name",
        :key="tag.name",
        :class="{ 'is-inversed': !tag.isActive }"
        ) {{ tag.name }} ({{ tag.count }})

    h2 Links
    .special-title(v-for="a in specialArticles")
      nuxt-link.nodeco-inline(:to="a.getHref()")
        i.mdi.mdi-rhombus-outline.is-primay
        | &#x20;
        span {{ a.title }}

  footer.sidebar-footer
    ul.social-links
      li
        a.social-link(href="http://twitter.com/endaaman")
          i.mdi.mdi-twitter
      li
        a.social-link(href="http://github.com/endaaman")
          i.mdi.mdi-github-face

    span.footer-left-text
      | Made with&#x20;
      i.mdi.mdi-heart.is-primay
      | &#x20;at&#x20;
      b-tooltip(:label="builtAt | date('YYYY-MM-DD HH:mm:ss')", top, size="is-small")
        span {{ builtAt | date('YYYY-MM-DD') }}

    span.footer-right-text(v-if="!authorized")
      nuxt-link.nodeco-inline(to="/login") Login
    span.footer-right-text(v-if="authorized")
      nuxt-link.nodeco-inline(to="/logout") Logout
    span.footer-right-text(v-if="authorized")
      nuxt-link.nodeco-inline(to="/admin") Admin
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  data() {
    return {
      categoryItems: [],
      tagItems: [],
    }
  },
  created() {
    this.categoryItems  = this.categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      category: c,
      isActive:
        (this.activeCategory && c.slug === this.activeCategory.slug)
        ||
        (this.activeArticle && !this.activeArticle.special && c.slug === this.activeArticle.categorySlug),
    }))
    this.tagItems = this.tags.map((t) => ({
      isActive: this.activeTag === t.name,
      ...t
    }))
  },
  mounted() {
    this.$nextTick(this.adjustScroll)
  },
  methods: {
    toggleArticlesList(item) {
      item.isActive = !item.isActive
    },
    adjustScroll() {
      const activeEl = this.$el.querySelector('.articles-by-category .is-active')
      if (!activeEl) {
        return
      }

      let i = 0
      while (i < this.categoryItems.length) {
        if (this.categoryItems[i].slug === this.activeArticle.categorySlug) {
          break
        }
        i += 1
      }
      if (i === this.categoryItems.length) {
        return
      }
      const container = this.$refs.articlesContainers[i]
      if (container) {
        if ((container.scrollTop > activeEl.offsetTop) || (container.scrollTop + container.offsetHeight < activeEl.offsetTop)) {
          container.scroll(0, activeEl.offsetTop - 64)
        }
      }
    }
  },
  watch: {
    $route(route) {
      this.$store.dispatch('layout/closeSidebar')
      this.$nextTick(this.adjustScroll)
    },
    activeTag(tag) {
      for (const t of this.tagItems) {
        t.isActive = t.name === tag
      }
    },
    activeCategory() {
      for (const c of this.categoryItems) {
        c.isActive = c.isActive || (this.activeCategory && c.slug === this.activeCategory.slug)
      }
    },
    activeArticle() {
      for (const c of this.categoryItems) {
        c.isActive = c.isActive || (this.activeArticle && !this.activeArticle.special && c.slug === this.activeArticle.categorySlug)
      }
    },
  },
  computed: {
    ...mapState([
      'authorized',
    ]),
    ...mapState('layout', [
      'isSmallScreen',
    ]),
    ...mapState('category', [
      'categories',
    ]),
    ...mapGetters([
      'activeCategory',
      'activeArticle',
      'activeTag',
    ]),
    ...mapGetters('article', {
      specialArticles: 'specialArticles',
      tags: 'tagAggregation',
      articleMap: 'articleMapKeyByCategory',
    }),
    builtAt() {
      return new Date(process.env.BUILT_AT)
    },
  },
}
</script>
