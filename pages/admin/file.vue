<style scoped lang="scss">
@import "../../css/variables";

.file-filename {
  font-family: $family-monospace;
}
.nowrap {
  white-space: nowrap;
}
</style>

<template lang="pug">
.admin-file-root
  ul.list-inline
    li
      button.button.is-small(@click="reload") Reload
    li
      input(type="file" ref="fileInput" @change.prevent="onSelectUploadings" multiple style="display: none")
      button.button.is-small.is-primary(v-if="uploadings.length === 0" @click="selectUploadings") Select files
      button.button.is-small.is-primary(v-else @click="uploadFiles") Upload!
    li
      button.button.is-small.is-success(@click="tryMakeDir") Make dir
    li
      b-input(v-model="filterStr", placeholder="Filter", type="search", icon="magnify", size="is-small", rounded)

  .tags(v-if="uploadings.length > 0")
    .tag(v-for="u in uploadings", :key="u.name")
      | {{ u.name }}&nbsp;&nbsp;
      button.delete.is-small(@click="unselectUploading(u)")

  nav.breadcrumb.is-small(aria-label="breadcrumbs")
    ul
      li
        nuxt-link(to="/admin/file") Root
      li(v-for="c in crumbs")
        nuxt-link(:to="'/admin/file?dir=' + c.dir") {{ c.name }}
      li


  p.has-text-grey(v-if="files.length === 0")
    | There is no file in {{ dirStr }} or no matched files

  b-table(
    v-else,
    :data="files",
    :mobile-cards="false",
    default-sort="directory",
    default-sort-direction="desc",
  )
    b-table-column(
      label="",
      field="directory",
      :sortable="true",
      :custom-sort="compareBool",
      centered,
      width="40",
      v-slot="props",
    )
      b-dropdown(:mobile-modal="isSmallScreen")
        a.icon.has-text-grey.clickable(@click="", slot="trigger")
          i.mdi.mdi-folder-outline(v-if="props.row.isDir")
          i.mdi.mdi-file(v-else)
        b-dropdown-item(@click="tryRenameFile(props.row.name)")
          .media
            b-icon.media-left(icon="pencil", type="is-success")
            .media-content Rename
        b-dropdown-item(@click="tryMoveFile(props.row.name)")
          .media
            b-icon.media-left(icon="keyboard-return", type="is-info")
            .media-content Move
        b-dropdown-item(@click="tryDeleteFile(props.row.name)")
          .media
            b-icon.media-left(icon="delete", type="is-danger")
            .media-content Delete
        b-dropdown-item(@click="copyFileUrl(props.row.name)")
          .media
            b-icon.media-left(icon="clipboard", type="is-dark")
            .media-content Copy URL
        b-dropdown-item(@click="copyFileAsMarkdown(props.row.name)")
          .media
            b-icon.media-left(icon="clipboard", type="is-dark")
            .media-content Copy md link

    b-table-column(label="Name", field="name", :sortable="true", v-slot="props")
      span.file-filename
        template(v-if="props.row.isDir")
          nuxt-link(:to="buildSubLink(props.row.name)") {{ props.row.name }}
          span &nbsp;/
        template(v-else)
          a(:href="buildFileLink(props.row.name)", target="_blank") {{ props.row.name }}
    b-table-column(label="Size", field="size", :sortable="true", v-slot="props")
      span.nowrap(:class="{ 'is-size-7': isSmallScreen }") {{ props.row.size | formatByteSize }}
    b-table-column(label="Date", field="date", :sortable="true", :visible="!isSmallScreen", v-slot="props")
      span {{ props.row.mtime | date('YYYY-MM-DD HH:mm') }}
</template>

<script>
import fecha from 'fecha'
import urlJoin from 'url-join'
import { mapState } from 'vuex'

async function fetch(store, route) {
  const dir = route.query.dir || ''
  await store.dispatch('file/fetchFiles', { dir })
}

export default {
  layout: 'simple',
  async fetch ({ store, route }) {
    await fetch(store, route)
  },
  async beforeRouteUpdate(to, from, next) {
    await fetch(this.$store, to)
    next()
  },
  data: () => ({
    filterStr: '',
    uploadings: [],
  }),
  computed: {
    ...mapState('layout', ['isSmallScreen']),
    dirSelectors() {
      const dirs = this.$store.getters['file/dirs']
      return dirs.map((dir) => dir || '<Root>')
    },
    dir() {
      return this.$route.query.dir || ''
    },
    dirStr() {
      return this.dir ? `"${this.dir}"` : 'root'
    },
    isRoot() {
      return !this.dir
    },
    files() {
      const files = this.$store.getters['file/getFiles'](this.dir) || []
      const f = this.filterStr
      return files.filter((file) => {
        let flag = true
        if (f) {
          flag = flag && file.name.indexOf(f) > -1
        }
        return flag
      })
    },
    crumbs() {
      if (!this.dir) {
        return []
      }
      let prev = ''
      const items = []
      for (const path of this.dir.split('/')) {
        const cur = prev + path
        items.push({
          name: path,
          dir: cur,
        })
        prev = cur + '/'
      }
      return items
    }
  },
  methods: {
    compareBool(a, b, isAsc) {
      return isAsc ? (a.isDir - b.isDir) : (b.isDir - a.isDir)
    },
    showError(error) {
      this.$buefy.dialog.alert({
        title: 'Error',
        message: error,
        type: 'is-danger',
      })
    },
    notify(message) {
      this.$buefy.toast.open({
        message: message,
        duration: 3000,
      })
    },
    selectUploadings() {
      this.$refs.fileInput.click()
    },
    onSelectUploadings(e) {
      const files = [ ...e.target.files ]
      this.uploadings = this.uploadings.concat(files)
    },
    unselectUploading(u) {
      this.uploadings = this.uploadings.filter(uu => uu !== u)
    },
    buildSubLink(dirName) {
      const dir = this.$route.query.dir
      let suffix
      if (!dir) {
        suffix = dirName
      } else {
        suffix = dir + '/' + dirName
      }
      return '/admin/file?dir=' + suffix
    },
    buildFileLink(fileName) {
      return urlJoin(this.$store.getters['staticRoot'], this.dir, fileName)
    },

    async reload() {
      const loading = this.$buefy.loading.open()
      await this.$store.dispatch('file/fetchFiles', { dir: this.dir })
      loading.close()
      this.notify('Reloaded')
    },

    async uploadFiles() {
      const dir = this.dir
      const loading = this.$buefy.loading.open()
      const { error } = await this.$store.dispatch('file/uploadFiles', { dir, files: this.uploadings })
      loading.close()
      this.uploadings = []
      if (error) {
        this.showError(error)
        return
      }
      this.notify('Uploaded files')
    },

    tryMakeDir() {
      this.$buefy.dialog.prompt({
        message: `Name of creating directory`,
        inputAttrs: {
          type: 'text',
          placeholder: 'Directory name',
          value: '',
        },
        confirmText: 'Create directory',
        onConfirm: async (value) => {
          await this.makeDir(value)
        }
      })
    },
    async makeDir(name) {
      const loading = this.$buefy.loading.open()
      const { error } = await this.$store.dispatch('file/makeDir', { dir: this.dir, name })
      loading.close()
      if (error) {
        this.showError(error)
        return
      }
      this.notify(`Created directory "${ name }" on ${ this.dirStr }"`)
    },

    tryDeleteFile(fileName) {
      this.$buefy.dialog.confirm({
        title: 'Confim delete',
        message: `OK to delete "${ fileName }" on ${ this.dirStr }`,
        cancelText: 'Cancel',
        confirmText: 'OK',
        type: 'is-danger',
        onConfirm: async () => { await this.deleteFile(fileName) }
      })
    },
    async deleteFile(fileName) {
      const dir = this.dir
      const loading = this.$buefy.loading.open()
      const { error } = await this.$store.dispatch('file/deleteFile', { dir, name: fileName })
      loading.close()
      if (error) {
        this.showError(error)
        return
      }
      this.notify(`Deleted "${ fileName }" on ${ this.dirStr }`)
    },

    tryRenameFile(fileName) {
      this.$buefy.dialog.prompt({
        title: 'Rename file',
        message: `New name of the file "${ fileName }"`,
        inputAttrs: {
          type: 'text',
          placeholder: 'New file name',
          value: fileName,
        },
        confirmText: 'Rename',
        onConfirm: async (value) => {
          await this.renameFile(fileName, value)
        }
      })
    },
    async renameFile(fileName, newFileName) {
      const loading = this.$buefy.loading.open()
      const { error } = await this.$store.dispatch('file/moveFile', {
        dir: this.dir,
        name: fileName,
        newDir: this.dir,
        newName: newFileName,
      })
      loading.close()
      if (error) {
        this.showError(error)
        return
      }
      this.notify(`Renamed "${ fileName }" -> "${ newFileName }" on ${ this.dirStr }`)
    },

    tryMoveFile(fileName) {
      this.$buefy.dialog.prompt({
        title: 'Move file',
        message: `Directory to move the file "${ fileName }"`,
        inputAttrs: {
          type: 'text',
          placeholder: 'Destination directory name',
          value: this.dir,
          required: '',
        },
        confirmText: 'Move file',
        onConfirm: async (value) => {
          await this.moveFile(fileName, value)
        }
      })
    },
    async moveFile(fileName, dest) {
      const loading = this.$buefy.loading.open()
      const { error } = await this.$store.dispatch('file/moveFile', {
        dir: this.dir,
        name: fileName,
        newDir: dest,
        newName: fileName,
      })
      loading.close()
      if (error) {
        this.showError(error)
        return
      }
      this.notify(`Moved "${ fileName }" from ${ this.dirStr } to "${ dest }"`)
    },

    copyToClipboard(content) {
      const cb = (e) => {
        e.preventDefault()
        e.clipboardData.setData('text', content)
        this.notify(`Copied "${ content }"`)
        document.removeEventListener('copy', cb, false)
      }
      document.addEventListener('copy', cb)
      document.execCommand('copy')
    },

    copyFileUrl(name) {
      const url = this.buildFileLink(name)
      this.copyToClipboard(url)
    },

    copyFileAsMarkdown(name) {
      const url = this.buildFileLink(name)
      this.copyToClipboard(`![${name}](${url})`)
    }
  }
}
</script>
