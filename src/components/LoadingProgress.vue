<template>
  <div 
    v-if="visible" 
    class="loading-progress-wrapper"
    :class="{ 'fullscreen': fullscreen }"
  >
    <div class="loading-overlay"></div>
    <div class="loading-content">
      <!-- Анимированный прогресс-бар -->
      <div class="progress-container">
        <div 
          class="progress-bar" 
          :style="{ width: progress + '%' }"
        ></div>
        <div class="progress-label">{{ progress }}%</div>
      </div>
      
      <!-- Анимированный лоадер -->
      <div v-if="showSpinner" class="spinner-container">
        <div class="spinner"></div>
      </div>
      
      <!-- Сообщение о загрузке -->
      <div v-if="message" class="loading-message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'

const props = defineProps({
  // Начальное состояние видимости
  visible: {
    type: Boolean,
    default: true
  },
  // Показывать ли на весь экран
  fullscreen: {
    type: Boolean,
    default: true
  },
  // Показывать ли спиннер
  showSpinner: {
    type: Boolean,
    default: true
  },
  // Текст сообщения
  message: {
    type: String,
    default: 'Загрузка...'
  },
  // Длительность анимации в мс
  duration: {
    type: Number,
    default: 2000
  },
  // Автоматически скрывать после завершения
  autoHide: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['complete', 'hide'])

const progress = ref(0)
const isVisible = ref(props.visible)
const animationInterval = ref(null)

// Анимация прогресса
const startAnimation = () => {
  clearInterval(animationInterval.value)
  progress.value = 0
  
  const step = 100 / (props.duration / 50) // Делаем плавную анимацию
  
  animationInterval.value = setInterval(() => {
    if (progress.value < 100) {
      progress.value = Math.min(progress.value + step, 100)
    } else {
      clearInterval(animationInterval.value)
      emit('complete')
      
      if (props.autoHide) {
        setTimeout(() => {
          hide()
        }, 300)
      }
    }
  }, 50)
}

// Метод для ручного обновления прогресса
const updateProgress = (value) => {
  progress.value = Math.min(Math.max(value, 0), 100)
}

// Метод для сброса прогресса
const reset = () => {
  progress.value = 0
  isVisible.value = true
  startAnimation()
}

// Метод для скрытия прогресс-бара
const hide = () => {
  isVisible.value = false
  clearInterval(animationInterval.value)
  emit('hide')
}

// Метод для показа прогресс-бара
const show = () => {
  isVisible.value = true
  startAnimation()
}

// Наблюдаем за изменениями видимости
watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    startAnimation()
  }
})

// Запускаем анимацию при монтировании
onMounted(() => {
  if (props.visible) {
    startAnimation()
  }
})

// Очищаем интервал при демонтировании
onUnmounted(() => {
  clearInterval(animationInterval.value)
})

// Экспортируем методы для использования извне
defineExpose({
  updateProgress,
  reset,
  hide,
  show
})
</script>

<style scoped>
.loading-progress-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-progress-wrapper.fullscreen {
  position: fixed;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.loading-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
}

.progress-container {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, 
    #2196F3 0%, 
    #21CBF3 25%, 
    #03DAC6 50%, 
    #21CBF3 75%, 
    #2196F3 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%);
  animation: shimmer 2s infinite;
}

.progress-label {
  position: absolute;
  top: -30px;
  right: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2196F3;
}

.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-message {
  font-size: 16px;
  font-weight: 500;
  color: #424242;
  text-align: center;
  margin-top: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Анимация появления/исчезновения */
.loading-progress-wrapper {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-progress-wrapper.hiding {
  animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>