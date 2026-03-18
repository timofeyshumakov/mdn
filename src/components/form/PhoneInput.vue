<template>
  <!-- Vuetify 3 default (current UI kit) -->
  <v-text-field
    v-if="effectiveUiKit === 'vuetify'"
    v-bind="$attrs"
    v-on="$attrs.on || {}"
    @blur="$emit('blur', $event)"
    @input="$emit('input', $event)"
    v-model="inputValue"
    :rules="[...(defaultRules || []), ...($attrs.rules || [])]"
    v-mask="phoneMask"
    maxlength="22"
    variant="outlined"
    counter
    :class="['mb-4', $attrs.class || '']"
    persistent-hint
    :placeholder="$attrs.placeholder || 'Укажите номер в международном формате, например +79991234567'"
  />

  <!-- Tailwind/HTML5 fallback (future UI kit switch) -->
  <div v-else class="w-full mb-4">
    <input
      v-bind="$attrs"
      :class="['w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500', $attrs.class]"
      type="tel"
      maxlength="22"
      pattern="\\+[1-9]\\d{1,14}"
      :placeholder="$attrs.placeholder || 'Укажите номер в международном формате, например +79991234567'"
      v-model="inputValue"
      v-mask="phoneMask"
    />
    <div v-if="counterVisible" class="text-xs text-gray-500 mt-1">
      {{ inputValue.value.length || 0 }}/22
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { mask } from 'vue-the-mask'

const vMask = mask

const props = defineProps({
  modelValue: String,
  uiKit: {
    type: String,
    default: 'vuetify'  // 'vuetify' | 'tailwind' | 'custom'
  },
  defaultRules: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'input'])

const effectiveUiKit = computed(() => props.uiKit || 'vuetify')
const phoneMask = ['+# (###) ### - ## - ##']

// Forward v-model
const inputValue = computed({
  get() { return props.modelValue || '' },
  set(val) { emit('update:modelValue', val) }
})

// Counter visibility logic (mimic Vuetify)
const counterVisible = computed(() => 
  inputValue.value.length > 0 && effectiveUiKit.value !== 'vuetify'
)

// Auto-format on change (optional phone validation)
watch(inputValue, (newVal) => {
  // Normalize: ensure starts with + and only digits after
  if (newVal && !newVal.startsWith('+')) {
    const normalized = '+' + newVal.replace(/[^0-9]/g, '');
    emit('update:modelValue', normalized);
  }
})
</script>

<style scoped>
/* Scoped styles for non-Vuetify modes */
</style>

