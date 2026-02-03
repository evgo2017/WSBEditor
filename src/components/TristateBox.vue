<template>
  <div class="tristate-box" 
       :class="{ enabled: modelValue === 1, disabled: modelValue === 2 }"
       @click="cycle">
      <div class="tristate-indicator">
          <span v-if="modelValue === 1">✔</span>
          <span v-if="modelValue === 2">✖</span>
      </div>
      <div class="tristate-info">
          <div class="tristate-label">{{ label }}</div>
          <div v-if="desc" class="tristate-note">{{ desc }}</div>
      </div>
      <div class="tristate-note">
          {{ displayText }}
      </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps(['modelValue', 'label', 'desc'])
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const displayText = computed(() => {
  if (props.modelValue === 0) return t('default')
  if (props.modelValue === 1) return t('enabled')
  return t('disabled')
})

const cycle = () => {
  const next = (props.modelValue + 1) % 3
  emit('update:modelValue', next)
}
</script>

<style scoped>
.tristate-box {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--secondary-color);
    border-radius: 12px;
    cursor: pointer;
    border: 1.5px solid transparent;
    user-select: none;
}

.tristate-box:hover {
    background: #eff1f5;
}

.tristate-box.enabled {
    border-color: var(--primary-color);
    background: #eff6ff;
}

.tristate-box.disabled {
    border-color: var(--danger-color);
    background: #fff1f2;
}

.tristate-indicator {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 2px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: white;
}

.enabled .tristate-indicator { background: var(--primary-color); border-color: var(--primary-color); }
.disabled .tristate-indicator { background: var(--danger-color); border-color: var(--danger-color); }

.tristate-label { font-size: 0.9rem; font-weight: 500; }
.tristate-note { font-size: 0.75rem; color: var(--text-muted); margin-left: auto; }
</style>
