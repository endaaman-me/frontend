<style scoped lang="scss">
</style>

<template lang="pug">
.login-root
  .notification.is-danger(v-if="errorMessage")
    button.delete(@click="errorMessage = ''")
    | {{ errorMessage }}
  form(v-on:submit.prevent="performLogin")
    .field
      label.lavel 俺用
      p.control
        input.input(type="password" placeholder="Password" ref="password")
    .field
      button.button(:class="{ 'is-loading': isLoading }") Login
</template>

<script>
import { mapState } from 'vuex'

export default {
  head() {
    return {
      title: 'Logout',
    }
  },
  data: () => ({
    isLoading: false,
    errorMessage: '',
  }),
  methods: {
    async performLogin() {
      this.isLoading = true
      this.errorMessage = ''
      const { error } = await this.$store.dispatch('login', {
        password: this.$refs.password.value
      })
      this.isLoading = false

      if (error) {
        this.$buefy.dialog.alert({
          title: 'Error',
          message: error,
          type: 'is-danger',
        })
      } else {
        this.$router.push('/')
        this.$buefy.toast.open({
          message: 'Logged in',
        })
      }
    }
  }
}

</script>
