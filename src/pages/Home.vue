<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <v-card class="mx-auto" flat>
          <!-- Заголовок формы -->
          <v-card-title class="text-center text-h5 pa-6 bg-primary">
            <span class="text-white">Форма заявки НСИ</span>
          </v-card-title>
          
          <!-- Динамический индикатор шагов -->
          <v-stepper v-model="currentStep" class="mb-4" alt-labels>
            <v-stepper-header class="px-0">
              <v-stepper-item
                v-for="step in availableSteps"
                :key="step.value"
                :value="step.value"
                :title="step.title"
                :subtitle="step.subtitle"
                class="flex-grow-1"
              ></v-stepper-item>
            </v-stepper-header>
          </v-stepper>

          <!-- Форма на всю ширину -->
          <v-form ref="form" v-model="formValid" @submit.prevent="submitForm" class="pa-6">
            
            <!-- Шаг 1: Основные данные (общие поля для всех типов) -->
            <div v-if="currentStep === 1">
              <!-- Дата заявки (автозаполнение) -->
              <v-text-field
                v-model="formData.date"
                label="Дата заявки"
                variant="outlined"
                readonly
                class="mb-4"
              ></v-text-field>
              
              <!-- Тип заявки -->
              <v-autocomplete
                v-model="formData.type"
                :items="requestTypeOptions"
                :loading="isLoadingRequestTypes"
                :disabled="isLoadingRequestTypes"
                label="Тип заявки"
                placeholder="Выберите тип заявки..."
                :rules="[v => !!v || 'Тип заявки обязателен']"
                item-title="title"
                item-value="id"
                variant="outlined"
                required
                class="mb-4"
                @update:model-value="handleTypeChange"
              ></v-autocomplete>
              
              <!-- Вид заявки -->
              <!--<v-autocomplete
                v-model="formData.view"
                :items="requestViewOptions"
                label="Вид заявки"
                placeholder="Выберите вид заявки..."
                :rules="[v => !!v || 'Вид заявки обязателен']"
                item-title="title"
                item-value="id"
                variant="outlined"
                required
                class="mb-4"
              ></v-autocomplete>-->
              
              <!-- Объект MDM -->
              <v-autocomplete
                v-model="formData.object"
                :items="filteredNsiObjectOptions"
                label="Объект MDM"
                placeholder="Выберите объект MDM..."
                :rules="[v => !!v || 'Объект MDM обязателен']"
                item-title="title"
                item-value="id"
                variant="outlined"
                required
                class="mb-4"
                @update:model-value="handleObjectChange"
              ></v-autocomplete>
              
              <!-- Поля в зависимости от объекта НСИ -->
              
              <!-- Для объекта "Контрагенты" -->
              <div v-if="formData.object === '16937'">
                <v-autocomplete
                  v-model="formData.counterpartyType"
                  :items="counterpartyTypeOptions"
                  label="Вид контрагента"
                  placeholder="Выберите вид контрагента..."
                  :rules="[v => !!v || 'Вид контрагента обязателен']"
                  variant="outlined"
                  required
                  class="mb-4"
                ></v-autocomplete>
              </div>
              
              <!-- Для объекта "Партнеры" -->
              <div v-else-if="formData.object === '16939'">
                <v-autocomplete
                  v-model="formData.partnerType"
                  :items="partnerTypeOptions"
                  label="Вид партнера"
                  placeholder="Выберите вид партнера..."
                  :rules="[v => !!v || 'Вид партнера обязателен']"
                  variant="outlined"
                  required
                  class="mb-4"
                ></v-autocomplete>
              </div>

              <!-- Комментарий -->
              <v-textarea
                v-model="formData.comment"
                label="Комментарий"
                placeholder="Введите комментарий..."
                :rules="commentRules"
                rows="3"
                variant="outlined"
                counter
                maxlength="250"
                class="mb-6"
              ></v-textarea>
              
              <div class="d-flex justify-end">
                <v-btn
                  color="primary"
                  @click="goToNextStep"
                  :disabled="!canGoToNextStep"
                  size="large"
                >
                  Далее
                  <v-icon end>mdi-arrow-right</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- Динамические шаги в зависимости от типа заявки и объекта НСИ -->
            <template v-for="(stepData, stepIndex) in dynamicSteps" :key="stepData.stepNumber">
              <div v-if="currentStep === stepData.stepNumber">
                <v-alert
                  type="info"
                  variant="tonal"
                  class="mb-6"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-information</v-icon>
                  </template>
                  {{ stepData.title }}
                </v-alert>
                
                <!-- Поля для объекта "Контрагенты" -->
                <div v-if="formData.object === '16937'">
                  <!-- Поля для добавления контрагента -->
                  <div v-if="formData.type === '16931'">
                    <!-- Шаг 2: Основные данные контрагента -->
                    <div v-if="stepData.stepNumber === 2">
                      <!-- Общие поля для всех видов контрагентов -->
                      <v-text-field
                        v-model="formData.inn"
                        :label="formData.counterpartyType === '16955' || formData.counterpartyType === '16957' || formData.counterpartyType === '16959' ? 'ИНН (12 символов)' : 'ИНН (10 символов)'"
                        placeholder="Введите ИНН..."
                        :rules="getInnRules()"
                        :maxlength="getInnMaxLength()"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.name"
                        label="Наименование"
                        placeholder="Введите наименование..."
                        :rules="[v => !!v || 'Наименование обязательно']"
                        :maxlength="100"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.shortName"
                        label="Сокр. наименование"
                        placeholder="Введите сокращенное наименование..."
                        :rules="[v => !!v || 'Сокращенное наименование обязательно']"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Поля для ЮЛ -->
                      <div v-if="formData.counterpartyType === '16953'">
                        <v-text-field
                          v-model="formData.kpp"
                          label="КПП"
                          placeholder="Введите КПП..."
                          :rules="kppRules"
                          :maxlength="9"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.ogrn"
                          label="ОГРН"
                          placeholder="Введите ОГРН..."
                          :rules="ogrnRules"
                          :maxlength="15"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.okpo"
                          label="ОКПО"
                          placeholder="Введите ОКПО..."
                          :rules="okpoRules"
                          :maxlength="10"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для ОПЮЛ -->
                      <div v-if="formData.counterpartyType === '16954'">
                        <v-text-field
                          v-model="formData.kpp"
                          label="КПП"
                          placeholder="Введите КПП..."
                          :rules="kppRules"
                          :maxlength="9"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.ogrn"
                          label="ОГРН"
                          placeholder="Введите ОГРН..."
                          :rules="ogrnRules"
                          :maxlength="15"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.headInn"
                          label="ИНН Головного к/а"
                          placeholder="Введите ИНН головного контрагента..."
                          :rules="headInnRules"
                          :maxlength="12"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.headCounterparty"
                          label="Головной контрагент"
                          placeholder="Введите наименование головного контрагента..."
                          :rules="[v => !!v || 'Головной контрагент обязателен']"
                          :maxlength="50"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для ФЛ -->
                      <div v-if="formData.counterpartyType === '16957'">
                        <v-text-field
                          v-model="formData.identityDocument"
                          label="Документ удост. личность"
                          placeholder="Введите данные документа..."
                          :rules="[v => !!v || 'Документ обязателен']"
                          :maxlength="150"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для ИП -->
                      <div v-if="formData.counterpartyType === '16955'">
                        <v-text-field
                          v-model="formData.ogrnip"
                          label="ОГРНИП"
                          placeholder="Введите ОГРНИП..."
                          :rules="ogrnipRules"
                          :maxlength="15"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для ЮЛН -->
                      <div v-if="formData.counterpartyType === '16959'">
                        <v-autocomplete
                          v-model="formData.registrationCountry"
                          :items="registrationCountryOptions"
                          item-title="NAME"
                          item-value="NAME"
                          label="Страна регистрации"
                          placeholder="Выберите страну регистрации..."
                          :rules="[v => !!v || 'Страна регистрации обязательна']"
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <v-text-field
                          v-model="formData.registrationNumber"
                          label="Рег. номер"
                          placeholder="Введите регистрационный номер..."
                          :rules="[v => !!v || 'Регистрационный номер обязателен']"
                          :maxlength="50"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.taxNumber"
                          label="Налоговый номер"
                          placeholder="Введите налоговый номер..."
                          :rules="[v => !!v || 'Налоговый номер обязателен']"
                          :maxlength="50"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                      </div>
                      
                      <!-- Общие поля для всех видов контрагентов -->
                      <v-text-field
                        v-model="formData.legalAddress"
                        label="Юридический адрес"
                        placeholder="Введите юридический адрес..."
                        :rules="[v => !!v || 'Юридический адрес обязателен']"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.actualAddress"
                        label="Фактический адрес"
                        placeholder="Введите фактический адрес..."
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-checkbox
                        v-model="formData.copyAddress"
                        label="Скопировать юридический адрес в фактический"
                        class="mb-4"
                        @update:model-value="handleCopyAddress"
                      ></v-checkbox>
                      
                      <v-text-field
                        v-model="formData.phone"
                        label="Телефон"
                        placeholder="Введите телефон..."
                        :rules="phoneRules"
                        :maxlength="20"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.email"
                        label="Электронная почта"
                        placeholder="Введите email..."
                        :rules="emailRules"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.contactPerson"
                        label="Контактное лицо"
                        placeholder="Введите контактное лицо..."
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-6"
                      ></v-text-field>
                    </div>
                    
                    <!-- Шаг 3: Дополнительные данные и файлы -->
                    <div v-if="stepData.stepNumber === 3">
                      <v-text-field
                        v-model="formData.partner"
                        label="Партнер"
                        placeholder="Введите наименование партнера..."
                        :rules="[v => !!v || 'Партнер обязателен']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.partnerCode"
                        label="Партнер (код)"
                        placeholder="Введите код партнера..."
                        :rules="[v => !!v || 'Код партнера обязателен']"
                        :maxlength="20"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>

                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
                    </div>
                  </div>
                  
                  <!-- Поля для изменения контрагента -->
                  <div v-else-if="formData.type === '16933'">
                    <!-- Шаг 2: Поиск контрагента -->
                    <div v-if="stepData.stepNumber === 2">
                      <v-text-field
                        v-model="formData.counterpartyCode"
                        label="Контрагент (код)"
                        placeholder="Введите код контрагента..."
                        :rules="[v => !!v || 'Код контрагента обязателен']"
                        :maxlength="20"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.inn"
                        label="Контрагент ИНН"
                        placeholder="Введите ИНН..."
                        :rules="innRules"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.name"
                        label="Наименование"
                        placeholder="Введите наименование..."
                        :rules="[v => !!v || 'Наименование обязательно']"
                        :maxlength="100"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
                    </div>
                    
                    <!-- Шаг 3: Поля для изменения -->
                    <div v-if="stepData.stepNumber === 3">
                      <v-text-field
                        v-model="formData.partnerCode"
                        label="Партнер (код)"
                        placeholder="Введите код партнера..."
                        :rules="partnerCodeRules"
                        :maxlength="20"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.partner"
                        label="Партнер"
                        placeholder="Введите наименование партнера..."
                        :rules="[v => !!v || 'Партнер обязателен']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.actualAddress"
                        label="Фактический адрес"
                        placeholder="Введите фактический адрес..."
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.legalAddress"
                        label="Юридический адрес"
                        placeholder="Введите юридический адрес..."
                        variant="outlined"
                        class="mb-6"
                      ></v-text-field>
                    </div>
                  </div>
                  
                  <!-- Поля для ошибки контрагента -->
                  <div v-else-if="formData.type === '16935'">
                    <!-- Шаг 2: Описание ошибки -->
                    <div v-if="stepData.stepNumber === 2">
                      <v-textarea
                        v-model="formData.errorDescription"
                        label="Описание ошибки"
                        placeholder="Опишите ошибку или требуемые доработки..."
                        :rules="[v => !!v || 'Описание ошибки обязательно']"
                        rows="4"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <v-checkbox
                        v-model="formData.hasScreenshot"
                        label="Файл/скриншот приложен"
                        class="mb-6"
                      ></v-checkbox>
                    </div>
                  </div>
                </div>
                
                <!-- Поля для объекта "Партнеры" -->
                <div v-else-if="formData.object === '16939'">
                  <!-- Поля для добавления партнера -->
                  <div v-if="formData.type === '16931'">
                    <!-- Шаг 2: Данные партнера -->
                    <div v-if="stepData.stepNumber === 2">
                      <!-- Поля для КП (компания) -->
                      <div v-if="formData.partnerType === 'КП (компания)'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Введите наименование..."
                          :rules="[v => !!v || 'Наименование обязательно']"
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <!-- Телефон (множественное) -->
                        <div class="mb-4">
                          <div class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.phone"
                              label="Телефон"
                              placeholder="Введите телефон..."
                              :rules="phoneRules"
                              :maxlength="25"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="primary"
                              variant="tonal"
                              size="small"
                              @click="addPhoneField"
                            >
                              <v-icon>mdi-plus</v-icon>
                            </v-btn>
                          </div>
                          
                          <!-- Дополнительные телефоны -->
                          <div v-for="(phone, index) in formData.additionalPhones" :key="index" class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.additionalPhones[index]"
                              :label="`Телефон ${index + 2}`"
                              placeholder="Введите дополнительный телефон..."
                              :rules="phoneRules"
                              :maxlength="25"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="error"
                              variant="tonal"
                              size="small"
                              @click="removePhoneField(index)"
                            >
                              <v-icon>mdi-minus</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        
                        <!-- Email (множественное) -->
                        <div class="mb-4">
                          <div class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.email"
                              label="Электронная почта"
                              placeholder="Введите email..."
                              :rules="emailRules"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="primary"
                              variant="tonal"
                              size="small"
                              @click="addEmailField"
                            >
                              <v-icon>mdi-plus</v-icon>
                            </v-btn>
                          </div>
                          
                          <!-- Дополнительные email -->
                          <div v-for="(email, index) in formData.additionalEmails" :key="index" class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.additionalEmails[index]"
                              :label="`Email ${index + 2}`"
                              placeholder="Введите дополнительный email..."
                              :rules="emailRules"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="error"
                              variant="tonal"
                              size="small"
                              @click="removeEmailField(index)"
                            >
                              <v-icon>mdi-minus</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        
                        <!-- Бизнес-регион (множественный выбор) -->
                        <v-autocomplete
                          v-model="formData.businessRegion"
                          :items="businessRegionOptions"
                          label="Бизнес-регион"
                          placeholder="Выберите бизнес-регион(ы)..."
                          :rules="[v => !!v && v.length > 0 || 'Выберите хотя бы один бизнес-регион']"
                          variant="outlined"
                          multiple
                          chips
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- Тип отношений (множественный выбор) -->
                        <v-autocomplete
                          v-model="formData.relationshipType"
                          :items="relationshipTypeOptions"
                          label="Тип отношений"
                          placeholder="Выберите тип(ы) отношений..."
                          variant="outlined"
                          multiple
                          chips
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <v-text-field
                          v-model="formData.legalAddress"
                          label="Юридический адрес"
                          placeholder="Введите юридический адрес..."
                          :rules="[v => !!v || 'Юридический адрес обязателен']"
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.actualAddress"
                          label="Фактический адрес"
                          placeholder="Введите фактический адрес..."
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-checkbox
                          v-model="formData.copyAddress"
                          label="Скопировать юридический адрес в фактический"
                          class="mb-4"
                          @update:model-value="handleCopyAddress"
                        ></v-checkbox>
                        
                        <!-- Категория B2 -->
                        <v-autocomplete
                          v-model="formData.categoryB2"
                          :items="categoryB2Options"
                          label="Категория B2"
                          placeholder="Выберите категорию B2..."
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- Категория СА -->
                        <v-autocomplete
                          v-model="formData.categoryCA"
                          :items="categoryCAOptions"
                          label="Категория СА"
                          placeholder="Выберите категорию СА..."
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- ЦКГ -->
                        <v-autocomplete
                          v-model="formData.ckg"
                          :items="ckgOptions"
                          label="ЦКГ"
                          placeholder="Выберите ЦКГ..."
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- ЦКГ B2B -->
                        <v-autocomplete
                          v-model="formData.ckgB2B"
                          :items="ckgB2BOptions"
                          label="ЦКГ B2B"
                          placeholder="Выберите ЦКГ B2B..."
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <v-text-field
                          v-model="formData.partnerCode"
                          label="Партнер (код)"
                          placeholder="Введите код партнера..."
                          :rules="[v => !!v || 'Код партнера обязателен']"
                          :maxlength="20"
                          variant="outlined"
                          counter
                          class="mb-6"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для ЧЛ (частное лицо) -->
                      <div v-else-if="formData.partnerType === '16963'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Введите ФИО..."
                          :rules="[v => !!v || 'Наименование обязательно']"
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.birthDate"
                          label="Дата рождения"
                          type="date"
                          variant="outlined"
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-radio-group
                          v-model="formData.gender"
                          label="Пол"
                          inline
                          class="mb-4"
                        >
                          <v-radio label="Мужской" value="male"></v-radio>
                          <v-radio label="Женский" value="female"></v-radio>
                        </v-radio-group>
                        
                        <!-- Телефон (множественное) -->
                        <div class="mb-4">
                          <div class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.phone"
                              label="Телефон"
                              placeholder="Введите телефон..."
                              :rules="phoneRules"
                              :maxlength="25"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="primary"
                              variant="tonal"
                              size="small"
                              @click="addPhoneField"
                            >
                              <v-icon>mdi-plus</v-icon>
                            </v-btn>
                          </div>
                          
                          <!-- Дополнительные телефоны -->
                          <div v-for="(phone, index) in formData.additionalPhones" :key="index" class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.additionalPhones[index]"
                              :label="`Телефон ${index + 2}`"
                              placeholder="Введите дополнительный телефон..."
                              :rules="phoneRules"
                              :maxlength="25"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="error"
                              variant="tonal"
                              size="small"
                              @click="removePhoneField(index)"
                            >
                              <v-icon>mdi-minus</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        
                        <!-- Email (множественное) -->
                        <div class="mb-4">
                          <div class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.email"
                              label="Электронная почта"
                              placeholder="Введите email..."
                              :rules="emailRules"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="primary"
                              variant="tonal"
                              size="small"
                              @click="addEmailField"
                            >
                              <v-icon>mdi-plus</v-icon>
                            </v-btn>
                          </div>
                          
                          <!-- Дополнительные email -->
                          <div v-for="(email, index) in formData.additionalEmails" :key="index" class="d-flex align-center mb-2">
                            <v-text-field
                              v-model="formData.additionalEmails[index]"
                              :label="`Email ${index + 2}`"
                              placeholder="Введите дополнительный email..."
                              :rules="emailRules"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="flex-grow-1 mr-2"
                            ></v-text-field>
                            <v-btn
                              color="error"
                              variant="tonal"
                              size="small"
                              @click="removeEmailField(index)"
                            >
                              <v-icon>mdi-minus</v-icon>
                            </v-btn>
                          </div>
                        </div>
                        
                        <!-- Поля для ЮЛН (юр лицо нерезидент) -->
                        <div v-if="formData.isNonResident">
                          <v-autocomplete
                            v-model="formData.registrationCountry"
                            :items="registrationCountryOptions"
                            label="Страна регистрации"
                            placeholder="Выберите страну регистрации..."
                            :rules="[v => !!v || 'Страна регистрации обязательна']"
                            variant="outlined"
                            class="mb-4"
                          ></v-autocomplete>
                          
                          <v-text-field
                            v-model="formData.registrationNumber"
                            label="Рег. номер"
                            placeholder="Введите регистрационный номер..."
                            :rules="[v => !!v || 'Регистрационный номер обязателен']"
                            :maxlength="50"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <v-text-field
                            v-model="formData.taxNumber"
                            label="Налоговый номер"
                            placeholder="Введите налоговый номер..."
                            :rules="[v => !!v || 'Налоговый номер обязателен']"
                            :maxlength="50"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                        </div>
                        
                        <v-checkbox
                          v-model="formData.isNonResident"
                          label="Юридическое лицо нерезидент"
                          class="mb-4"
                        ></v-checkbox>
                        
                        <v-text-field
                          v-model="formData.partnerCode"
                          label="Партнер (код)"
                          placeholder="Введите код партнера..."
                          :rules="[v => !!v || 'Код партнера обязателен']"
                          :maxlength="20"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.partner"
                          label="Партнер"
                          placeholder="Введите наименование партнера..."
                          :rules="[v => !!v || 'Партнер обязателен']"
                          :maxlength="150"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
                      </div>
                    </div>
                    
                    <!-- Шаг 3: Файлы -->
                    <div v-if="stepData.stepNumber === 3">
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
                    </div>
                  </div>
                  
                  <!-- Поля для изменения партнера -->
                  <div v-else-if="formData.type === '16933'">
                    <!-- Шаг 2: Поиск партнера -->
                    <div v-if="stepData.stepNumber === 2">
                      <v-text-field
                        v-model="formData.partnerCode"
                        label="Партнер (код)"
                        placeholder="Введите код партнера..."
                        :rules="[v => !!v || 'Код партнера обязателен']"
                        :maxlength="20"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model="formData.partner"
                        label="Партнер"
                        placeholder="Введите наименование партнера..."
                        :rules="[v => !!v || 'Партнер обязателен']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
                    </div>
                    
                    <!-- Шаг 3: Поля для изменения -->
                    <div v-if="stepData.stepNumber === 3">
                      <!-- Поля для изменения партнера КП -->
                      <div v-if="formData.partnerType === '16961'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Введите наименование..."
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.legalAddress"
                          label="Юридический адрес"
                          placeholder="Введите юридический адрес..."
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.actualAddress"
                          label="Фактический адрес"
                          placeholder="Введите фактический адрес..."
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-6"
                        ></v-text-field>
                      </div>
                      
                      <!-- Поля для изменения партнера ЧЛ -->
                      <div v-else-if="formData.partnerType === '16963'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Введите ФИО..."
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.phone"
                          label="Телефон"
                          placeholder="Введите телефон..."
                          :maxlength="25"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.email"
                          label="Электронная почта"
                          placeholder="Введите email..."
                          :maxlength="50"
                          variant="outlined"
                          counter
                          class="mb-6"
                        ></v-text-field>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Поля для ошибки партнера -->
                  <div v-else-if="formData.type === '16935'">
                    <!-- Шаг 2: Описание ошибки -->
                    <div v-if="stepData.stepNumber === 2">
                      <v-textarea
                        v-model="formData.errorDescription"
                        label="Описание ошибки"
                        placeholder="Опишите ошибку или требуемые доработки..."
                        :rules="[v => !!v || 'Описание ошибки обязательно']"
                        rows="4"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <v-checkbox
                        v-model="formData.hasScreenshot"
                        label="Файл/скриншот приложен"
                        class="mb-6"
                      ></v-checkbox>
                    </div>
                  </div>
                </div>
<!-- Поля для объекта "Договоры" -->
      <div v-else-if="formData.object === '16943'">
        <!-- Шаг 2: Данные договора -->
        <div v-if="stepData.stepNumber === 2">
          <!-- Цель договора -->
          <v-autocomplete
            v-model="formData.contractPurpose"
            :items="contractPurposeOptions"
            label="Цель договора"
            placeholder="Выберите цель договора..."
            :rules="[v => !!v || 'Цель договора обязательна']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Номер договора -->
          <v-text-field
            v-model="formData.contractNumber"
            label="Номер договора"
            placeholder="Введите номер договора..."
            :rules="[v => !!v || 'Номер договора обязателен']"
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Дата -->
          <v-text-field
            v-model="formData.contractDate"
            label="Дата договора"
            type="date"
            variant="outlined"
            required
            class="mb-4"
          ></v-text-field>
          
          <!-- Период действия с -->
          <v-text-field
            v-model="formData.contractPeriodFrom"
            label="Период действия с"
            type="date"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Период действия по -->
          <v-text-field
            v-model="formData.contractPeriodTo"
            label="Период действия по"
            type="date"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Наименование -->
          <v-text-field
            v-model="formData.contractName"
            label="Наименование договора"
            placeholder="Введите наименование договора..."
            :rules="[v => !!v || 'Наименование договора обязательно']"
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Подразделение -->
          <v-text-field
            v-model="formData.department"
            label="Подразделение"
            placeholder="Введите подразделение..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Организация ИНН -->
          <v-text-field
            v-model="formData.organizationInn"
            label="Организация ИНН"
            placeholder="Введите ИНН организации..."
            :rules="organizationInnRules"
            :maxlength="12"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Организация -->
          <v-autocomplete
            v-model="formData.organization"
            :items="organizationOptions"
            label="Организация"
            placeholder="Выберите организацию..."
            :rules="[v => !!v || 'Организация обязательна']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Счет организации -->
          <v-text-field
            v-model="formData.organizationAccount"
            label="Счет организации"
            placeholder="Введите счет организации..."
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Контрагент ИНН -->
          <v-text-field
            v-model="formData.counterpartyInn"
            label="Контрагент ИНН"
            placeholder="Введите ИНН контрагента..."
            :rules="counterpartyInnRules"
            :maxlength="12"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Контрагент (код) -->
          <v-text-field
            v-model="formData.counterpartyCode"
            label="Контрагент (код)"
            placeholder="Введите код контрагента..."
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Счет контрагента -->
          <v-text-field
            v-model="formData.counterpartyAccount"
            label="Счет контрагента"
            placeholder="Введите счет контрагента..."
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Партнер (код) -->
          <v-text-field
            v-model="formData.partnerCode"
            label="Партнер (код)"
            placeholder="Введите код партнера..."
            :rules="[v => !!v || 'Код партнера обязателен']"
            :maxlength="20"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Партнер -->
          <v-text-field
            v-model="formData.partner"
            label="Партнер"
            placeholder="Введите наименование партнера..."
            :rules="[v => !!v || 'Партнер обязателен']"
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Детализация расчётов -->
          <v-autocomplete
            v-model="formData.paymentDetails"
            :items="paymentDetailsOptions"
            label="Детализация расчётов"
            placeholder="Выберите детализацию расчётов..."
            :rules="[v => !!v || 'Детализация расчётов обязательна']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Валюта -->
          <v-autocomplete
            v-model="formData.currency"
            :items="currencyOptions"
            label="Валюта"
            placeholder="Выберите валюту..."
            :rules="[v => !!v || 'Валюта обязательна']"
            item-title="FULL_NAME"
            item-value="CURRENCY"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Оплата в иностранной валюте -->
          <v-checkbox
            v-model="formData.foreignCurrencyPayment"
            label="Оплата в иностранной валюте"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Сумма договора фиксирована -->
          <v-checkbox
            v-model="formData.fixedContractAmount"
            label="Сумма договора фиксирована"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Разрешена работа с дочерними партнерами -->
          <v-checkbox
            v-model="formData.allowSubsidiaryPartners"
            label="Разрешена работа с дочерними партнерами"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Маркируемая продукция -->
          <v-autocomplete
            v-model="formData.labeledProducts"
            :items="labeledProductsOptions"
            label="Маркируемая продукция"
            placeholder="Выберите вариант..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Запрещать отгрузку -->
          <v-checkbox
            v-model="formData.prohibitShipment"
            label="Запрещать отгрузку"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Не отгружать при сумме задолженности -->
          <v-checkbox
            v-model="formData.dontShipOnDebt"
            label="Не отгружать при сумме задолженности"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Сумма задолженности -->
          <v-text-field
            v-model="formData.debtAmount"
            label="Сумма задолженности"
            placeholder="Введите сумму задолженности..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Ставка НДС -->
          <v-autocomplete
            v-model="formData.vatRate"
            :items="vatRateOptions"
            label="Ставка НДС"
            placeholder="Выберите ставку НДС..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Группа фин. учета -->
          <v-autocomplete
            v-model="formData.financialGroup"
            :items="financialGroupOptions"
            label="Группа фин. учета"
            placeholder="Выберите группу фин. учета..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Статья ДДС -->
          <v-autocomplete
            v-model="formData.ddsArticle"
            :items="ddsArticleOptions"
            label="Статья ДДС"
            placeholder="Выберите статью ДДС..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Классификация задолженности -->
          <v-autocomplete
            v-model="formData.debtClassification"
            :items="debtClassificationOptions"
            label="Классификация задолженности"
            placeholder="Выберите классификацию задолженности..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Операция декларации по НДС -->
          <v-autocomplete
            v-model="formData.vatDeclarationOperation"
            :items="vatDeclarationOperationOptions"
            label="Операция декларации по НДС"
            placeholder="Выберите операцию..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Направление деятельности -->
          <v-text-field
            v-model="formData.activityDirection"
            label="Направление деятельности"
            placeholder="Введите направление деятельности..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Файл -->
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
        </div>
      </div>
      
      <!-- Поля для объекта "Банковские счета" -->
      <div v-else-if="formData.object === '16941'">
        <!-- Шаг 2: Основные данные -->
        <div v-if="stepData.stepNumber === 2">
          <!-- Статус -->
          <v-autocomplete
            v-model="formData.bankAccountStatus"
            :items="bankAccountStatusOptions"
            label="Статус"
            placeholder="Выберите статус счета..."
            :rules="[v => !!v || 'Статус обязателен']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Контрагент ИНН -->
          <v-text-field
            v-model="formData.counterpartyInn"
            label="Контрагент ИНН"
            placeholder="Введите ИНН контрагента..."
            :rules="getInnRules()"
            :maxlength="12"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Контрагент -->
          <v-text-field
            v-model="formData.counterparty"
            label="Контрагент"
            placeholder="Введите наименование контрагента..."
            :rules="[v => !!v || 'Контрагент обязателен']"
            :maxlength="150"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Вид банка -->
          <v-autocomplete
            v-model="formData.bankType"
            :items="bankTypeOptions"
            label="Вид банка"
            placeholder="Выберите вид банка..."
            :rules="[v => !!v || 'Вид банка обязателен']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
            @update:model-value="handleBankTypeChange"
          ></v-autocomplete>
        </div>
        
        <!-- Шаг 3: Данные банка -->
        <div v-if="stepData.stepNumber === 3">
          <!-- Для национального банка -->
          <div v-if="formData.bankType === 'national'">
            <!-- БИК -->
            <v-text-field
              v-model="formData.bik"
              label="БИК"
              placeholder="Введите БИК банка..."
              :rules="bikRules"
              :maxlength="9"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Наименование банка -->
            <v-text-field
              v-model="formData.bankName"
              label="Наименование банка"
              placeholder="Введите наименование банка..."
              :rules="[v => !!v || 'Наименование банка обязательно']"
              :maxlength="50"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Валюта -->
            <v-autocomplete
              v-model="formData.currency"
              :items="currencyOptions"
              label="Валюта"
              placeholder="Выберите валюту..."
              :rules="[v => !!v || 'Валюта обязательна']"
              item-title="title"
              item-value="id"
              variant="outlined"
              required
              class="mb-4"
            ></v-autocomplete>
            
            <!-- Расчетный счет -->
            <v-text-field
              v-model="formData.accountNumber"
              label="Расчетный счет"
              placeholder="Введите расчетный счет..."
              :rules="accountNumberRules"
              :maxlength="20"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Корреспондентский счет -->
            <v-text-field
              v-model="formData.correspondentAccount"
              label="Корреспондентский счет"
              placeholder="Введите корреспондентский счет..."
              :rules="correspondentAccountRules"
              :maxlength="20"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
          </div>
          
          <!-- Для международного банка -->
          <div v-else-if="formData.bankType === 'international'">
            <!-- SWIFT -->
            <v-text-field
              v-model="formData.swift"
              label="SWIFT"
              placeholder="Введите SWIFT код..."
              :rules="swiftRules"
              :maxlength="11"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Наименование банка -->
            <v-text-field
              v-model="formData.bankName"
              label="Наименование банка"
              placeholder="Введите наименование банка..."
              :rules="[v => !!v || 'Наименование банка обязательно']"
              :maxlength="50"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Страна регистрации и город -->
            <v-text-field
              v-model="formData.bankRegistrationCity"
              label="Страна регистрации и город"
              placeholder="Введите страну и город регистрации банка..."
              :rules="[v => !!v || 'Страна и город обязательны']"
              :maxlength="50"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Адрес -->
            <v-text-field
              v-model="formData.bankAddress"
              label="Адрес банка"
              placeholder="Введите адрес банка..."
              :maxlength="50"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Валюта -->
            <v-autocomplete
              v-model="formData.currency"
              :items="currencyOptions"
              label="Валюта"
              placeholder="Выберите валюту..."
              :rules="[v => !!v || 'Валюта обязательна']"
              item-title="title"
              item-value="id"
              variant="outlined"
              required
              class="mb-4"
            ></v-autocomplete>
            
            <!-- Расчетный счет -->
            <v-text-field
              v-model="formData.accountNumber"
              label="Расчетный счет"
              placeholder="Введите расчетный счет..."
              :rules="accountNumberRules"
              :maxlength="20"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
            
            <!-- Корреспондентский счет -->
            <v-text-field
              v-model="formData.correspondentAccount"
              label="Корреспондентский счет"
              placeholder="Введите корреспондентский счет..."
              :rules="correspondentAccountRules"
              :maxlength="20"
              variant="outlined"
              counter
              class="mb-4"
            ></v-text-field>
          </div>
          
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
        </div>
      </div>
      
      <!-- Поля для объекта "Склады" -->
      <div v-else-if="formData.object === '16945'">
        <!-- Шаг 2: Данные склада -->
        <div v-if="stepData.stepNumber === 2">
          <!-- Тип склада -->
          <v-autocomplete
            v-model="formData.warehouseType"
            :items="warehouseTypeOptions"
            label="Тип склада"
            placeholder="Выберите тип склада..."
            :rules="[v => !!v || 'Тип склада обязателен']"
            item-title="title"
            item-value="id"
            variant="outlined"
            required
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Группа складов -->
          <v-text-field
            v-model="formData.warehouseGroup"
            label="Группа складов"
            placeholder="Введите группу складов..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Наименование -->
          <v-text-field
            v-model="formData.warehouseName"
            label="Наименование склада"
            placeholder="Введите наименование склада..."
            :rules="[v => !!v || 'Наименование склада обязательно']"
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Источник информации о ценах -->
          <v-autocomplete
            v-model="formData.priceSource"
            :items="priceSourceOptions"
            label="Источник информации о ценах"
            placeholder="Выберите источник информации о ценах..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Учетный вид цены -->
          <v-text-field
            v-model="formData.accountingPriceType"
            label="Учетный вид цены"
            placeholder="Введите учетный вид цены..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Контролировать свободные остатки -->
          <v-checkbox
            v-model="formData.controlFreeBalance"
            label="Контролировать свободные остатки"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Контролировать оперативные остатки -->
          <v-checkbox
            v-model="formData.controlOperationalBalance"
            label="Контролировать оперативные остатки"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Подразделение -->
          <v-text-field
            v-model="formData.department"
            label="Подразделение"
            placeholder="Введите подразделение..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Ответственный (МОЛ) -->
          <v-text-field
            v-model="formData.responsiblePerson"
            label="Ответственный (МОЛ)"
            placeholder="Введите ФИО ответственного..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Бизнес-регион -->
          <v-autocomplete
            v-model="formData.businessRegion"
            :items="businessRegionOptions"
            label="Бизнес-регион"
            placeholder="Выберите бизнес-регион..."
            variant="outlined"
            class="mb-4"
          ></v-autocomplete>
          
          <!-- Ордерная схема -->
          <v-checkbox
            v-model="formData.orderScheme"
            label="Ордерная схема"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Ячейки -->
          <v-checkbox
            v-model="formData.hasCells"
            label="Ячейки"
            class="mb-4"
          ></v-checkbox>
          
          <!-- Адрес -->
          <v-text-field
            v-model="formData.warehouseAddress"
            label="Адрес склада"
            placeholder="Введите адрес склада..."
            :maxlength="250"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Телефон -->
          <v-text-field
            v-model="formData.warehousePhone"
            label="Телефон склада"
            placeholder="Введите телефон склада..."
            :rules="phoneRules"
            :maxlength="20"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Комментарий -->
          <v-textarea
            v-model="formData.warehouseComment"
            label="Комментарий"
            placeholder="Введите комментарий..."
            :maxlength="250"
            rows="3"
            variant="outlined"
            counter
            class="mb-4"
          ></v-textarea>
          
          <!-- Файл -->
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Прикрепить файлы"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                      ></v-file-input>
          
          <!-- Склад (код) -->
          <v-text-field
            v-model="formData.warehouseCode"
            label="Склад (код)"
            placeholder="Введите код склада..."
            :rules="[v => !!v || 'Код склада обязателен']"
            :maxlength="20"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Наименование склада (дополнительное) -->
          <v-text-field
            v-model="formData.warehouseNameSecondary"
            label="Наименование склада (дополнительное)"
            placeholder="Введите дополнительное наименование..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-6"
          ></v-text-field>
        </div>
      </div>
      
      <!-- Поля для объекта "Упаковки" -->
      <div v-else-if="formData.object === '16947'">
        <!-- Шаг 2: Данные упаковки -->
        <div v-if="stepData.stepNumber === 2">
          <!-- Номенклатура -->
          <v-text-field
            v-model="formData.nomenclature"
            label="Номенклатура"
            placeholder="Введите номенклатуру..."
            :rules="[v => !!v || 'Номенклатура обязательна']"
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Номенклатура код -->
          <v-select
            v-model="formData.nomenclatureCodes"
            :items="nomenclatureCodeOptions"
            label="Номенклатура код"
            placeholder="Выберите коды номенклатуры..."
            variant="outlined"
            multiple
            chips
            class="mb-4"
          ></v-select>
          
          <!-- Дополнительно -->
          <v-text-field
            v-model="formData.additionalInfo"
            label="Дополнительно"
            placeholder="Введите дополнительную информацию..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Единица измерения -->
          <v-text-field
            v-model="formData.measurementUnit"
            label="Единица измерения"
            placeholder="Введите единицу измерения..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- 1 шт упаковки состоит из -->
          <v-text-field
            v-model="formData.packageComposition"
            label="1 шт упаковки состоит из"
            placeholder="Введите состав упаковки..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-4"
          ></v-text-field>
          
          <!-- Вес -->
          <v-text-field
            v-model="formData.weight"
            label="Вес"
            placeholder="Введите вес..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Высота, м -->
          <v-text-field
            v-model="formData.height"
            label="Высота, м"
            placeholder="Введите высоту..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Ширина, м -->
          <v-text-field
            v-model="formData.width"
            label="Ширина, м"
            placeholder="Введите ширину..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Глубина, м -->
          <v-text-field
            v-model="formData.depth"
            label="Глубина, м"
            placeholder="Введите глубину..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Объем -->
          <v-text-field
            v-model="formData.volume"
            label="Объем"
            placeholder="Введите объем..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Типоразмер -->
          <v-text-field
            v-model="formData.typeSize"
            label="Типоразмер"
            placeholder="Введите типоразмер..."
            type="number"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <!-- Дополнительно (вторая) -->
          <v-text-field
            v-model="formData.additionalInfoSecondary"
            label="Дополнительно"
            placeholder="Введите дополнительную информацию..."
            :maxlength="50"
            variant="outlined"
            counter
            class="mb-6"
          ></v-text-field>
        </div>
      </div>
                <!-- Поля для других объектов НСИ -->
                <div v-else>
                  <!-- Поля для банковских счетов или других объектов -->
                  <div v-if="stepData.stepNumber === 2">
                    <p>Настройте поля для объекта НСИ: {{ getNsiObjectTitle(formData.object) }}</p>
                  </div>
                </div>
                
                <div class="d-flex justify-space-between">
                  <v-btn
                    variant="outlined"
                    @click="goToPreviousStep"
                    size="large"
                  >
                    <v-icon start>mdi-arrow-left</v-icon>
                    Назад
                  </v-btn>
                  
                  <v-btn
                    color="primary"
                    @click="goToNextStep"
                    :disabled="!canGoToNextStep"
                    size="large"
                  >
                    {{ stepData.nextButtonText || 'Далее' }}
                    <v-icon end>mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </div>
            </template>
          </v-form>
          
          <!-- Статус отправки -->
          <v-alert
            v-if="submitStatus"
            :type="submitStatus.type"
            :text="submitStatus.message"
            class="mx-6 mb-6"
            closable
            @click:close="submitStatus = null"
          ></v-alert>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { callApi, getListElements } from '../functions/callApi'

// Состояние формы
const currentStep = ref(1)
const formValid = ref(false)
const isSubmitting = ref(false)
const form = ref(null)
const submitStatus = ref(null)
const isLoadingRequestTypes = ref(false)

// Данные формы
const formData = reactive({
  date: new Date().toLocaleDateString('ru-RU'),
  type: null, // '16931', '16933', '16935'
  view: '',
  object: '',
  comment: '',
  
  // Общие поля для шага 1
  counterpartyType: null, // Для Контрагентов
  partnerType: null, // Для Партнеров
  
  // Поля для Контрагентов (шаг 2)
  inn: '',
  name: '',
  shortName: '',
  kpp: '',
  ogrn: '',
  ogrnip: '',
  okpo: '',
  headInn: '',
  headCounterparty: '',
  identityDocument: '',
  registrationCountry: '',
  registrationNumber: '',
  taxNumber: '',
  legalAddress: '',
  actualAddress: '',
  copyAddress: false,
  phone: '',
  email: '',
  contactPerson: '',
  
  // Поля для Партнеров (шаг 2)
  birthDate: '',
  gender: '',
  businessRegion: [],
  relationshipType: [],
  categoryB2: '',
  categoryCA: '',
  ckg: '',
  ckgB2B: '',
  isNonResident: false,

// Поля для Договоров
  contractPurpose: '',
  contractNumber: '',
  contractDate: '',
  contractPeriodFrom: '',
  contractPeriodTo: '',
  contractName: '',
  department: '',
  organizationInn: '',
  organization: '',
  organizationAccount: '',
  counterpartyInn: '',
  counterpartyCode: '',
  counterpartyAccount: '',
  paymentDetails: '',
  currency: '',
  foreignCurrencyPayment: false,
  fixedContractAmount: false,
  allowSubsidiaryPartners: false,
  labeledProducts: '',
  prohibitShipment: false,
  dontShipOnDebt: false,
  debtAmount: '',
  vatRate: '',
  financialGroup: '',
  ddsArticle: '',
  debtClassification: '',
  vatDeclarationOperation: 0,
  activityDirection: '',
  
  // Поля для Банковских счетов
  bankAccountStatus: '',
  bankType: '',
  bik: '',
  bankName: '',
  swift: '',
  bankRegistrationCity: '',
  bankAddress: '',
  accountNumber: '',
  correspondentAccount: '',
  
  // Поля для Складов
  warehouseType: '',
  warehouseGroup: '',
  warehouseName: '',
  priceSource: '',
  accountingPriceType: '',
  controlFreeBalance: false,
  controlOperationalBalance: false,
  responsiblePerson: '',
  orderScheme: false,
  hasCells: false,
  warehouseAddress: '',
  warehousePhone: '',
  warehouseComment: '',
  warehouseCode: '',
  warehouseNameSecondary: '',
  
  // Поля для Упаковок
  nomenclature: '',
  nomenclatureCodes: [],
  additionalInfo: '',
  measurementUnit: '',
  packageComposition: '',
  weight: '',
  height: '',
  width: '',
  depth: '',
  volume: '',
  typeSize: '',
  additionalInfoSecondary: '',
  // Множественные поля
  additionalPhones: [],
  additionalEmails: [],
  
  // Поля для шага 3
  partner: '',
  partnerCode: '',
  hasFile: null,
  
  // Поля для изменения (шаг 2)
  counterpartyCode: '',
  
  // Поля для ошибки (шаг 2)
  errorDescription: '',
  hasScreenshot: false,
})

// Опции для выпадающих списков
const requestTypeOptions = ref([
  { id: '16931', title: 'Добавление', bitrixId: '16931' },
  { id: '16933', title: 'Изменение', bitrixId: '16933' },
  { id: '16935', title: 'Ошибка/доработка', bitrixId: '16935' }
])
const nsiObjectOptions = ref([]);
const filteredNsiObjectOptions = computed(() => {
  const excludedIds = [];//['Механики акций', 'Прайс-листы', 'Скидки (наценки)']; // Массив ID, которые нужно исключить
  return nsiObjectOptions.value.filter(option => !excludedIds.includes(option.title));
});
const requestViewOptions = ref([
  { id: '16943', title: 'Индивидуальный', bitrixId: '16943' },
  { id: '16945', title: 'Групповой', bitrixId: '16945' }
])

// Опции для Контрагентов
const counterpartyTypeOptions = ref([
  { id: '16953', title: 'Юридическое лицо', bitrixId: '16953' },
  { id: '16954', title: 'Обособленное подразделение Юр лица', bitrixId: '16954' },
  { id: '16957', title: 'Физическое лицо', bitrixId: '16957' },
  { id: '16955', title: 'Индивидуальный предприниматель', bitrixId: '16955' },
  { id: '16959', title: 'Юридическое лицо нерезидент', bitrixId: '16959' }
])

// Опции для Партнеров
const partnerTypeOptions = ref([
  { id: '16961', title: 'КП (компания)', bitrixId: '16961' },
  { id: '16963', title: 'ЧЛ (частное лицо)', bitrixId: '16963' }
])

// Опции для бизнес-регионов
const businessRegionOptions = ref([]);


// Опции для категорий B2 (пример)
const categoryB2Options = ref([
  { id: 'C9', title: 'C9' },
  { id: 'C1', title: 'С1' },
  { id: 'C10', title: 'С10' },
  { id: 'C11', title: 'С11' },
  { id: 'C2', title: 'С2' },
  { id: 'C3', title: 'С3' },
  { id: 'C4', title: 'С4' },
  { id: 'C5', title: 'С5' },
  { id: 'C6', title: 'С6' },
  { id: 'C7', title: 'С7' },
  { id: 'C8', title: 'С8' },
  { id: 'C9', title: 'С9' },
  { id: 'C10', title: 'C10' },
  { id: 'gormedtechnika_moscow', title: 'ГОРМЕДТЕХНИКА МОСКВЫ' },
  { id: 'group_a_b2g', title: 'Группа А b2g' },
  { id: 'group_b_b2g', title: 'Группа В b2g' },
  { id: 'group_c_b2g', title: 'Группа С b2g' },
  { id: 'direct_moscow', title: 'ДИРЕКЦИЯ МОСКВЫ' },
  { id: 'key_b2g', title: 'Ключевые b2g' },
  { id: 'ktson', title: 'КЦСОН' },
  { id: 'co_executors', title: 'Мы соисполнители' },
  { id: 'intermediaries_b2g', title: 'Посредники b2g' },
  { id: 'fss', title: 'ФСС' },
  { id: 'hospitals', title: 'БОЛЬНИЦЫ И ПРОЧИЕ ГОС.ЗАКАЗЧИКИ' },
  { id: 'other_b2c', title: 'Прочие b2c' },
  { id: 'physical_persons', title: 'Физические лица' },
  { id: 'bf', title: 'БФ' }
])

// Опции для категорий СА (пример)
const categoryCAOptions = ref([
  { id: 'distributor', title: 'Дистрибьютор' },
  { id: 'cabinet', title: 'Кабинет' },
  { id: 'marketplace', title: 'Маркетплейс' },
  { id: 'retail', title: 'Розница' },
  { id: 'network', title: 'Сеть' },
  { id: 'field_team', title: 'Выездная бригада' }
])

// Опции для ЦКГ (пример)
const ckgOptions = ref([
  { id: 'gk_fz_223', title: 'ГК ФЗ 223' },
  { id: 'internet_shop', title: 'Интернет-магазин' },
  { id: 'market_place', title: 'Маркет Плейс' },
  { id: 'moscow_prop', title: 'Московское Проп' },
  { id: 'wholesaler', title: 'Оптовик' },
  { id: 'rent', title: 'Прокат' },
  { id: 'retail_network', title: 'Розничная сеть' },
  { id: 'retail_point', title: 'Розничная точка' },
  { id: 'self_service', title: 'Самообеспечение' },
  { id: 'pharmacy_chain', title: 'Сеть аптек' },
  { id: 'telemarketing', title: 'Телемаркет' },
  { id: 'export', title: 'Экспорт' },
  { id: 'charity_fund', title: 'Благотворительный фонд' }
])

// Опции для ЦКГ B2B (пример)
const ckgB2BOptions = ref([
  { id: 'bf_network', title: 'БФ сеть' },
  { id: 'for_yourself', title: 'Для себя' },
  { id: 'for_yourself_network', title: 'Для себя сеть' },
  { id: 'im', title: 'ИМ' },
  { id: 'im_network', title: 'ИМ сеть' },
  { id: 'comb_im_network_opt_network', title: 'Комби ИМ сеть/Опт сеть' },
  { id: 'comb_im_network_rt_network', title: 'Комби ИМ сеть/РТ сеть' },
  { id: 'comb_im_rt_half_network', title: 'Комби ИМ/РТ полусеть' },
  { id: 'comb_rt_network_for_yourself_network', title: 'Комби РТ сеть/Для себя сеть' },
  { id: 'mp', title: 'МП' },
  { id: 'opt', title: 'Опт' },
  { id: 'opt_network', title: 'Опт сеть' },
  { id: 'rt', title: 'РТ' },
  { id: 'rt_half_network', title: 'РТ полусеть' },
  { id: 'rt_network', title: 'РТ сеть' },
  { id: 'bf', title: 'БФ' }
])

// Опции для стран регистрации (пример)
const registrationCountryOptions = ref([
  { id: 'kz', title: 'Казахстан' },
  { id: 'by', title: 'Беларусь' },
  { id: 'uz', title: 'Узбекистан' },
  { id: 'az', title: 'Азербайджан' },
  { id: 'ge', title: 'Грузия' },
  { id: 'us', title: 'США' },
  { id: 'eu', title: 'Европа' },
  { id: 'ae', title: 'ОАЭ' },
  { id: 'africa', title: 'Африка' }
])

// Опции для типа отношений (пример)
const relationshipTypeOptions = ref([
  { id: 'supplier', title: 'Поставщик' },
  { id: 'customer', title: 'Заказчик' },
  { id: 'partner', title: 'Партнер' },
  { id: 'distributor', title: 'Дистрибьютор' },
  { id: 'reseller', title: 'Реселлер' }
])

const contractPurposeOptions = ref([
  { id: 'purchase', title: 'Закупка' },
  { id: 'purchase_import', title: 'Закупка (импорт)' },
  { id: 'purchase_eaes', title: 'Закупка (ЕАЭС)' },
  { id: 'transfer_processing', title: 'Передача в переработку' },
  { id: 'transfer_processing_eaes', title: 'Передача в переработку (в страны ЕАЭС)' },
  { id: 'transfer_storage', title: 'Передача на ответственное хранение' },
  { id: 'reception_processing', title: 'Прием в переработку' },
  { id: 'reception_commission', title: 'Прием на комиссию' },
  { id: 'reception_storage', title: 'Прием на ответственное хранение' },
  { id: 'sale', title: 'Реализация' }
])

const organizationOptions = ref([
  { id: '0', title: 'Нифонтов Александр Викторович ИП' },
  { id: '1', title: 'ОРТОНИКА МАРКЕТ ООО' },
  { id: '2', title: 'ОРТОНИКА ООО' },
  { id: '3', title: 'ОРТОНИКА ПЛЮС ООО' },
  { id: '4', title: 'РА (ՌԵԱՄԵԴ ՍՊԸ)' },
  { id: '5', title: 'РГ (Circle Logistics LLC)' },
  { id: '6', title: 'РЕАМЕД ООО' },
  { id: '7', title: 'СИСТЕМЫ УПРАВЛЕНИЯ ООО' },
  { id: '8', title: 'СУРДЭКС ООО' },
  { id: '9', title: 'ТД ОРТОНИКА ООО' },
  { id: '10', title: 'Терехов Кирилл Владимирович ИП' },
  { id: '11', title: 'ИНВАТОРГ ООО' },
])

const paymentDetailsOptions = ref([
  { id: '0', title: 'По заказам' },
  { id: '1', title: 'По договорам' },
  { id: '2', title: 'Аванс по договорам, долг по накладным' },
  { id: '3', title: 'Аванс по заказам, долг по накладным' },
  { id: '4', title: 'По расчетным документам' },
])

const currencyOptions = ref([
  { id: 'RUB', title: 'Рубли' },
  { id: 'USD', title: 'Доллары' },
  { id: 'EUR', title: 'Евро' },
  { id: 'CNY', title: 'Юани' }
])

const labeledProductsOptions = ref([
  { id: 'option1', title: 'Вариант 1' },
  { id: 'option2', title: 'Вариант 2' },
  { id: 'option3', title: 'Вариант 3' }
])

const vatRateOptions = ref([
  { id: '0', title: 'Без НДС' },
  { id: '1', title: '0' },
  { id: '2', title: '5' },
  { id: '3', title: '7' },
  { id: '4', title: '10' },
  { id: '5', title: '18' },
  { id: '6', title: '20' },
  { id: '7', title: '22' },
])

const financialGroupOptions = ref([
  { id: '55.03_deposits_rub', title: '55.03 - Депозиты в рублях' },
  { id: '58.03_loans_given', title: '58.03 - Займы выданные' },
  { id: '60.01_rub_suppliers', title: '60.01 - поставщики в рублях' },
  { id: '60.21_currency_suppliers', title: '60.21 - Поставщики в валюте' },
  { id: '62_currency_customers', title: '62 - Покупатели в валюте' },
  { id: '62_rub_customers', title: '62 - Покупатели в рублях' },
  { id: '66_loans_received', title: '66 - Займы полученные' },
  { id: '76.02_claims_customers', title: '76.02 - Расчеты по претензиям с клиентами' },
  { id: '76.02_claims_suppliers', title: '76.02 - Расчеты по претензиям с поставщиками' },
  { id: '76.05_suppliers', title: '76.05 - Поставщики обеспечение и услуги' },
  { id: '76.06_co_executors', title: '76.06 - Соисполнители (СИ)' },
  { id: '76.07_rent', title: '76.07 - Аренда' },
  { id: '76.07_rent_vehicles', title: '76.07 - Аренда ТС и оборудования' },
  { id: '76.09_security', title: '76.09 - Расчеты по обеспечению ГИ и ГО' },
  { id: '76.10_individuals', title: '76.10 - Прочие расчеты с физическими лицами' },
  { id: '76.35_currency_suppliers', title: '76.35 - Поставщики обеспечение и услуги (в валюте)' },
  //{ id: '60_processing', title: '60 - услуги по переработке' },
])

const ddsArticleOptions = ref([
  { id: '0', title: 'Аренда производственных мощностей и коммунальные услуги' },
  { id: '1', title: 'Аренда складского и производственного имущества' },
  { id: '2', title: 'Доходы от аренды имущества' },
  { id: '3', title: 'Доходы от прочей деятельности' },
  { id: '4', title: 'Доходы от соисполнительства' },
  { id: '5', title: 'Интеркомпани' },
  { id: '6', title: 'Обеспечение гарантийных обязательств (оборот)' },
  { id: '7', title: 'Обеспечение ГК (оборот)' },
  { id: '8', title: 'оступления от покупателей' },
  { id: '9', title: 'Прочие' },
  { id: '10', title: 'Санкции по продажам и ГК (доходы)' },
  { id: '11', title: 'Услуги по переработке (доходы)' },
  { id: '12', title: 'Аренда офиса' },
  { id: '13', title: 'Коммунальные услуги' },
])

const debtClassificationOptions = ref([
  { id: 'short_term', title: 'Краткосрочная' },
  { id: 'long_term', title: 'Долгосрочная' }
])

const vatDeclarationOperationOptions = ref([
  { id: '0', title: 'Реализация медицинских товаров отечественного и зарубежного производства по перечню, утверждаемому Правительством РФ' },
])

// Опции для Банковских счетов
const bankAccountStatusOptions = ref([
  { id: 'open', title: 'Открыт' },
  { id: 'closed', title: 'Закрыт' },
  { id: 'reserve', title: 'Резерв' }
])

const bankTypeOptions = ref([
  { id: 'national', title: 'Национальный' },
  { id: 'international', title: 'Международный' }
])

// Опции для Складов
const warehouseTypeOptions = ref([
  { id: 'retail', title: 'Розничный' },
  { id: 'wholesale', title: 'Оптовый' }
])

const priceSourceOptions = ref([
  { id: 'option1', title: 'По виду цен' },
  { id: 'option2', title: 'По себестоимости' },
])

// Опции для Упаковок
const nomenclatureCodeOptions = ref([
  { id: 'option1', title: 'Вариант 1' },
  { id: 'option2', title: 'Вариант 2' },
  { id: 'option3', title: 'Вариант 3' },
  { id: 'option4', title: 'Вариант 4' },
  { id: 'option5', title: 'Вариант 5' }
])

// Настройки шагов для каждого типа заявки и объекта НСИ
const stepConfigs = {
  // Для объекта "Контрагенты" (16937)
  '16937': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные контрагента', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Дополнительные данные и файлы', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск контрагента', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Поля для изменения', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
  // Для объекта "Партнеры" (16939)
  '16939': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Файлы', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Поля для изменения', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
'16943': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные договора', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Данные для изменения договора', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
  
  // Для объекта "Банковские счета" (16941)
  '16941': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Основные данные счета', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные банка', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск банковского счета', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных счета', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
  
  // Для объекта "Склады" (16945)
  '16945': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные склада', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск склада', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных склада', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
  
  // Для объекта "Упаковки" (16947)
  '16947': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные упаковки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск упаковки', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных упаковки', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  },
  // Для других объектов НСИ (базовый конфиг)
  'default': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16935': { // Ошибка
      steps: [
        { stepNumber: 2, title: 'Описание ошибки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    }
  }
}

// Вычисляемые свойства для шагов
const availableSteps = computed(() => {
  const steps = [
    { value: 1, title: 'Шаг 1', subtitle: 'Основные данные' }
  ]
  
  if (formData.object && formData.type) {
    const config = stepConfigs[formData.object] || stepConfigs['default']
    const typeConfig = config[formData.type]
    
    if (typeConfig) {
      typeConfig.steps.forEach(step => {
        steps.push({
          value: step.stepNumber,
          title: `Шаг ${step.stepNumber}`,
          subtitle: step.title
        })
      })
    }
  }
  
  return steps
})

const dynamicSteps = computed(() => {
  if (!formData.object || !formData.type) return []
  
  const config = stepConfigs[formData.object] || stepConfigs['default']
  const typeConfig = config[formData.type]
  
  if (!typeConfig) return []
  
  return typeConfig.steps.map(step => ({
    ...step,
    nextButtonText: step.stepNumber === typeConfig.steps.length ? 'Отправить' : 'Далее'
  }))
})

const totalSteps = computed(() => {
  if (!formData.object || !formData.type) return 1
  
  const config = stepConfigs[formData.object] || stepConfigs['default']
  const typeConfig = config[formData.type]
  
  return typeConfig ? typeConfig.totalSteps : 1
})

// Правила валидации
const commentRules = [
  v => !v || v.length <= 250 || 'Комментарий не должен превышать 250 символов'
]

const getInnRules = () => {
  if (formData.counterpartyType === '16955' || formData.counterpartyType === '16957' || formData.counterpartyType === '16959') {
    return [
      v => !!v || 'ИНН обязателен',
      v => /^\d{12}$/.test(v) || 'ИНН должен содержать 12 цифр'
    ]
  } else {
    return [
      v => !!v || 'ИНН обязателен',
      v => /^\d{10}$/.test(v) || 'ИНН должен содержать 10 цифр'
    ]
  }
}

const getInnMaxLength = () => {
  if (formData.counterpartyType === '16955' || formData.counterpartyType === '16957' || formData.counterpartyType === '16959') {
    return 12
  } else {
    return 10
  }
}

const headInnRules = [
  v => !!v || 'ИНН головного контрагента обязателен',
  v => /^\d{12}$/.test(v) || 'ИНН должен содержать 12 цифр'
]

const kppRules = [
  v => !v || /^\d{9}$/.test(v) || 'КПП должен содержать 9 цифр'
]

const ogrnRules = [
  v => !v || /^\d{13,15}$/.test(v) || 'ОГРН должен содержать 13 или 15 цифр'
]

const ogrnipRules = [
  v => !v || /^\d{15}$/.test(v) || 'ОГРНИП должен содержать 15 цифр'
]

const okpoRules = [
  v => !v || /^\d{8,10}$/.test(v) || 'ОКПО должен содержать 8-10 цифр'
]

const phoneRules = [
  v => !v || /^[\d\s\+\-\(\)]+$/.test(v) || 'Некорректный номер телефона'
]

const emailRules = [
  v => !v || /.+@.+\..+/.test(v) || 'Некорректный email адрес'
]

const partnerCodeRules = [
  v => !!v || 'Код партнера обязателен',
  v => /^[A-Za-z0-9]+$/.test(v) || 'Код должен содержать только буквы и цифры'
]

const organizationInnRules = [
  v => !!v || 'ИНН организации обязателен',
  v => /^\d{12}$/.test(v) || 'ИНН должен содержать 12 цифр'
]

const counterpartyInnRules = [
  v => !!v || 'ИНН контрагента обязателен',
  v => /^\d{12}$/.test(v) || 'ИНН должен содержать 12 цифр'
]

const bikRules = [
  v => !!v || 'БИК обязателен',
  v => /^\d{9}$/.test(v) || 'БИК должен содержать 9 цифр'
]

const swiftRules = [
  v => !!v || 'SWIFT код обязателен',
  v => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) || 'Некорректный SWIFT код'
]

const accountNumberRules = [
  v => !!v || 'Номер счета обязателен',
  v => /^\d{20}$/.test(v) || 'Номер счета должен содержать 20 цифр'
]

const correspondentAccountRules = [
  v => !!v || 'Корреспондентский счет обязателен',
  v => /^\d{20}$/.test(v) || 'Корреспондентский счет должен содержать 20 цифр'
]

const handleBankTypeChange = (value) => {
  // Сбрасываем поля банка при изменении типа
  formData.bik = ''
  formData.swift = ''
  formData.bankName = ''
  formData.bankRegistrationCity = ''
  formData.bankAddress = ''
  formData.currency = ''
  formData.accountNumber = ''
  formData.correspondentAccount = ''
}
const hasAtLeastOneFieldForModification = () => {
  if (formData.type !== '16933') return true
  
  // Проверяем наличие хотя бы одного заполненного поля в зависимости от объекта
  if (formData.object === '16937') { // Контрагенты
    // Проверяем поля для изменения контрагента
    const modificationFields = [
      formData.partnerCode,
      formData.partner,
      formData.actualAddress,
      formData.legalAddress
    ]
    return modificationFields.some(field => field && field.trim() !== '')
  } 
  else if (formData.object === '16939') { // Партнеры
    // Проверяем поля для изменения партнера
    if (formData.partnerType === '16961') { // КП
      const modificationFieldsKP = [
        formData.name,
        formData.legalAddress,
        formData.actualAddress
      ]
      return modificationFieldsKP.some(field => field && field.trim() !== '')
    } 
    else if (formData.partnerType === '16963') { // ЧЛ
      const modificationFieldsCHL = [
        formData.name,
        formData.phone,
        formData.email
      ]
      return modificationFieldsCHL.some(field => field && field.trim() !== '')
    }
  }
  // Для других объектов НСИ
  else if (formData.object === '16941') { // Банковские счета
    const modificationFieldsBank = [
      formData.bik,
      formData.swift,
      formData.bankName,
      formData.accountNumber,
      formData.correspondentAccount
    ]
    return modificationFieldsBank.some(field => field && field.trim() !== '')
  }
  else if (formData.object === '16945') { // Склады
    const modificationFieldsWarehouse = [
      formData.warehouseName,
      formData.warehouseAddress,
      formData.warehousePhone
    ]
    return modificationFieldsWarehouse.some(field => field && field.trim() !== '')
  }
  else if (formData.object === '16947') { // Упаковки
    const modificationFieldsPackage = [
      formData.nomenclature,
      formData.additionalInfo,
      formData.weight
    ]
    return modificationFieldsPackage.some(field => field && field.trim() !== '')
  }
  
  return false
}
// Проверка возможности перехода на следующий шаг
const canGoToNextStep = computed(() => {
  if (currentStep.value === 1) {
    const basicFields = !!formData.type && !!formData.object //!!formData.view && 
    
    if (formData.object === '16937') { // Контрагенты
      return basicFields && !!formData.counterpartyType
    } else if (formData.object === '16939') { // Партнеры
      return basicFields && !!formData.partnerType
    }
    
    return basicFields
  }
  
  // Проверка для шага 2 и далее
  if (formData.object === '16937') { // Контрагенты
    if (formData.type === '16931') { // Добавление
      if (currentStep.value === 2) {
        return !!formData.inn && !!formData.name && !!formData.shortName
      } else if (currentStep.value === 3) {
        return !!formData.partner && !!formData.partnerCode
      }
    } else if (formData.type === '16933') { // Изменение
      if (currentStep.value === 2) {
        // Проверяем, что хотя бы одно поле поиска заполнено
        const searchFields = [
          formData.counterpartyCode,
          formData.inn,
          formData.name
        ]
        return searchFields.some(field => field && field.trim() !== '')
      } else if (currentStep.value === 3) {
        // Проверяем, что хотя бы одно поле для изменения заполнено
        return hasAtLeastOneFieldForModification()
      }
    } else if (formData.type === '16935') { // Ошибка
      if (currentStep.value === 2) {
        return !!formData.errorDescription
      }
    }
  } else if (formData.object === '16939') { // Партнеры
    if (formData.type === '16931') { // Добавление
      if (currentStep.value === 2) {
        if (formData.partnerType === '16961') { // КП
          return !!formData.name && !!formData.partnerCode && formData.businessRegion && formData.businessRegion.length > 0
        } else if (formData.partnerType === '16963') { // ЧЛ
          return !!formData.name && !!formData.partnerCode && !!formData.partner
        }
      }
    } else if (formData.type === '16933') { // Изменение
      if (currentStep.value === 2) {
        // Проверяем, что хотя бы одно поле поиска заполнено
        const searchFields = [
          formData.partnerCode,
          formData.partner
        ]
        return searchFields.some(field => field && field.trim() !== '')
      } else if (currentStep.value === 3) {
        // Проверяем, что хотя бы одно поле для изменения заполнено
        return hasAtLeastOneFieldForModification()
      }
    } else if (formData.type === '16935') { // Ошибка
      if (currentStep.value === 2) {
        return !!formData.errorDescription
      }
    }
  }
 else if (formData.object === '16943') { // Договоры
    if (formData.type === '16933') { // Изменение
      if (currentStep.value === 2) {
        return hasAtLeastOneFieldForModification()
      }
    }
  }
  else if (formData.object === '16941') { // Банковские счета
    if (formData.type === '16933') { // Изменение
      if (currentStep.value === 3) {
        return hasAtLeastOneFieldForModification()
      }
    }
  }
  else if (formData.object === '16945') { // Склады
    if (formData.type === '16933') { // Изменение
      if (currentStep.value === 3) {
        return hasAtLeastOneFieldForModification()
      }
    }
  }
  else if (formData.object === '16947') { // Упаковки
    if (formData.type === '16933') { // Изменение
      if (currentStep.value === 3) {
        return hasAtLeastOneFieldForModification()
      }
    }
  }
  
  return true
})

// Навигация по шагам
const goToNextStep = async () => {
  if (currentStep.value === 1) {
    const { valid } = await form.value.validate()
    if (!valid) return
  }
  
  const isLastStep = currentStep.value === totalSteps.value
  
  if (isLastStep) {
    await submitForm()
  } else if (currentStep.value < totalSteps.value) {
    currentStep.value++
  }
}

const goToPreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Обработчики изменений
const handleTypeChange = () => {
  // Сбрасываем шаг при изменении типа заявки
  if (currentStep.value > 1) {
    currentStep.value = 1
  }
}

const handleObjectChange = () => {
  // Сбрасываем шаг и поля при изменении объекта НСИ
  if (currentStep.value > 1) {
    currentStep.value = 1
  }
  
  // Сбрасываем поля, специфичные для объекта
  if (formData.object === '16937') { // Контрагенты
    formData.partnerType = null
    formData.businessRegion = []
    formData.relationshipType = []
    formData.categoryB2 = ''
    formData.categoryCA = ''
    formData.ckg = ''
    formData.ckgB2B = ''
    formData.birthDate = ''
    formData.gender = ''
    formData.isNonResident = false
  } else if (formData.object === '16939') { // Партнеры
    formData.counterpartyType = null
    formData.inn = ''
    formData.shortName = ''
    formData.kpp = ''
    formData.ogrn = ''
    formData.ogrnip = ''
    formData.okpo = ''
    formData.headInn = ''
    formData.headCounterparty = ''
    formData.identityDocument = ''
    formData.registrationCountry = ''
    formData.registrationNumber = ''
    formData.taxNumber = ''
    formData.contactPerson = ''
  }
}

const handleCopyAddress = (value) => {
  if (value && formData.legalAddress) {
    formData.actualAddress = formData.legalAddress
  } else if (!value) {
    formData.actualAddress = ''
  }
}

// Функции для множественных полей
const addPhoneField = () => {
  formData.additionalPhones.push('')
}

const removePhoneField = (index) => {
  formData.additionalPhones.splice(index, 1)
}

const addEmailField = () => {
  formData.additionalEmails.push('')
}

const removeEmailField = (index) => {
  formData.additionalEmails.splice(index, 1)
}

// Вспомогательные функции для получения названий
const getRequestTypeTitle = (id) => {
  const item = requestTypeOptions.value.find(item => item.id === id)
  return item ? item.title : ''
}

const getRequestViewTitle = (id) => {
  const item = requestViewOptions.value.find(item => item.id === id)
  return item ? item.title : ''
}

const getNsiObjectTitle = (id) => {
  const item = nsiObjectOptions.value.find(item => item.id === id)
  return item ? item.title : ''
}

const getCounterpartyTypeTitle = (id) => {
  const item = counterpartyTypeOptions.value.find(item => item.id === id)
  return item ? item.title : ''
}

const getPartnerTypeTitle = (id) => {
  const item = partnerTypeOptions.value.find(item => item.id === id)
  return item ? item.title : ''
}

// Функция для получения всех полей заявки для комментария (обновленная)
const getAllRequestFields = () => {
  const fields = []
  
  // Основные поля
  fields.push(`Тип заявки: ${getRequestTypeTitle(formData.type)}`)
  //fields.push(`Вид заявки: ${getRequestViewTitle(formData.view)}`)
  fields.push(`Объект MDM: ${getNsiObjectTitle(formData.object)}`)
  
  if (formData.object === '16937') { // Контрагенты
    fields.push(`Вид контрагента: ${getCounterpartyTypeTitle(formData.counterpartyType)}`)
  } else if (formData.object === '16939') { // Партнеры
    fields.push(`Вид партнера: ${getPartnerTypeTitle(formData.partnerType)}`)
  }

  if (formData.comment) {
    fields.push(`Комментарий: ${formData.comment}`)
  }
  
  // Добавляем поля в зависимости от объекта НСИ и типа заявки
  if (formData.object === '16937') { // Контрагенты
    if (formData.type === '16931') { // Добавление
      fields.push(`ИНН: ${formData.inn}`)
      fields.push(`Наименование: ${formData.name}`)
      fields.push(`Сокр. наименование: ${formData.shortName}`)
      
      if (formData.kpp) fields.push(`КПП: ${formData.kpp}`)
      if (formData.ogrn) fields.push(`ОГРН: ${formData.ogrn}`)
      if (formData.ogrnip) fields.push(`ОГРНИП: ${formData.ogrnip}`)
      if (formData.okpo) fields.push(`ОКПО: ${formData.okpo}`)
      if (formData.headInn) fields.push(`ИНН Головного к/а: ${formData.headInn}`)
      if (formData.headCounterparty) fields.push(`Головной контрагент: ${formData.headCounterparty}`)
      if (formData.identityDocument) fields.push(`Документ удост. личность: ${formData.identityDocument}`)
      if (formData.registrationCountry) fields.push(`Страна регистрации: ${formData.registrationCountry}`)
      if (formData.registrationNumber) fields.push(`Рег. номер: ${formData.registrationNumber}`)
      if (formData.taxNumber) fields.push(`Налоговый номер: ${formData.taxNumber}`)
      
      fields.push(`Юридический адрес: ${formData.legalAddress}`)
      if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
      if (formData.phone) fields.push(`Телефон: ${formData.phone}`)
      if (formData.email) fields.push(`Электронная почта: ${formData.email}`)
      if (formData.contactPerson) fields.push(`Контактное лицо: ${formData.contactPerson}`)
      fields.push(`Партнер: ${formData.partner}`)
      fields.push(`Партнер (код): ${formData.partnerCode}`)
    } else if (formData.type === '16933') { // Изменение
      fields.push(`Контрагент (код): ${formData.counterpartyCode}`)
      fields.push(`ИНН: ${formData.inn}`)
      fields.push(`Наименование: ${formData.name}`)
      fields.push(`Партнер (код): ${formData.partnerCode || 'Не указан'}`)
      fields.push(`Партнер: ${formData.partner || 'Не указан'}`)
      
      if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
      if (formData.legalAddress) fields.push(`Юридический адрес: ${formData.legalAddress}`)
    } else if (formData.type === '16935') { // Ошибка
      fields.push(`Описание ошибки: ${formData.errorDescription}`)
      fields.push(`Скриншот приложен: ${formData.hasScreenshot ? 'Да' : 'Нет'}`)
    }
  } else if (formData.object === '16939') { // Партнеры
    if (formData.type === '16931') { // Добавление
      fields.push(`Наименование: ${formData.name}`)
      
      if (formData.birthDate) fields.push(`Дата рождения: ${formData.birthDate}`)
      if (formData.gender) fields.push(`Пол: ${formData.gender === 'male' ? 'Мужской' : 'Женский'}`)
      
      if (formData.phone) fields.push(`Телефон: ${formData.phone}`)
      if (formData.additionalPhones && formData.additionalPhones.length > 0) {
        formData.additionalPhones.forEach((phone, index) => {
          if (phone) fields.push(`Телефон ${index + 2}: ${phone}`)
        })
      }
      
      if (formData.email) fields.push(`Электронная почта: ${formData.email}`)
      if (formData.additionalEmails && formData.additionalEmails.length > 0) {
        formData.additionalEmails.forEach((email, index) => {
          if (email) fields.push(`Email ${index + 2}: ${email}`)
        })
      }
      
      if (formData.businessRegion && formData.businessRegion.length > 0) {
        const regions = formData.businessRegion.map(region => {
          const item = businessRegionOptions.value.find(item => item.id === region)
          return item ? item.title : region
        }).join(', ')
        fields.push(`Бизнес-регион: ${regions}`)
      }
      
      if (formData.relationshipType && formData.relationshipType.length > 0) {
        const relationships = formData.relationshipType.map(rel => {
          const item = relationshipTypeOptions.value.find(item => item.id === rel)
          return item ? item.title : rel
        }).join(', ')
        fields.push(`Тип отношений: ${relationships}`)
      }
      
      if (formData.legalAddress) fields.push(`Юридический адрес: ${formData.legalAddress}`)
      if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
      
      if (formData.categoryB2) {
        const item = categoryB2Options.value.find(item => item.id === formData.categoryB2)
        fields.push(`Категория B2: ${item ? item.title : formData.categoryB2}`)
      }
      
      if (formData.categoryCA) {
        const item = categoryCAOptions.value.find(item => item.id === formData.categoryCA)
        fields.push(`Категория СА: ${item ? item.title : formData.categoryCA}`)
      }
      
      if (formData.ckg) {
        const item = ckgOptions.value.find(item => item.id === formData.ckg)
        fields.push(`ЦКГ: ${item ? item.title : formData.ckg}`)
      }
      
      if (formData.ckgB2B) {
        const item = ckgB2BOptions.value.find(item => item.id === formData.ckgB2B)
        fields.push(`ЦКГ B2B: ${item ? item.title : formData.ckgB2B}`)
      }
      
      fields.push(`Партнер (код): ${formData.partnerCode}`)
      fields.push(`Партнер: ${formData.partner}`)
      
      if (formData.isNonResident) {
        fields.push(`Юридическое лицо нерезидент: Да`)
        if (formData.registrationCountry) fields.push(`Страна регистрации: ${formData.registrationCountry}`)
        if (formData.registrationNumber) fields.push(`Рег. номер: ${formData.registrationNumber}`)
        if (formData.taxNumber) fields.push(`Налоговый номер: ${formData.taxNumber}`)
      }
    } else if (formData.type === '16933') { // Изменение
      fields.push(`Партнер (код): ${formData.partnerCode}`)
      fields.push(`Партнер: ${formData.partner}`)
      
      if (formData.name) fields.push(`Наименование: ${formData.name}`)
      if (formData.phone) fields.push(`Телефон: ${formData.phone}`)
      if (formData.email) fields.push(`Электронная почта: ${formData.email}`)
      if (formData.legalAddress) fields.push(`Юридический адрес: ${formData.legalAddress}`)
      if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
    } else if (formData.type === '16935') { // Ошибка
      fields.push(`Описание ошибки: ${formData.errorDescription}`)
      fields.push(`Скриншот приложен: ${formData.hasScreenshot ? 'Да' : 'Нет'}`)
    }
  }
if (formData.object === '16943') {
    if (formData.contractPurpose) {
      const item = contractPurposeOptions.value.find(item => item.id === formData.contractPurpose)
      fields.push(`Цель договора: ${item ? item.title : formData.contractPurpose}`)
    }
    if (formData.contractNumber) fields.push(`Номер договора: ${formData.contractNumber}`)
    if (formData.contractDate) fields.push(`Дата договора: ${formData.contractDate}`)
    if (formData.contractPeriodFrom) fields.push(`Период действия с: ${formData.contractPeriodFrom}`)
    if (formData.contractPeriodTo) fields.push(`Период действия по: ${formData.contractPeriodTo}`)
    if (formData.contractName) fields.push(`Наименование договора: ${formData.contractName}`)
    if (formData.department) fields.push(`Подразделение: ${formData.department}`)
    if (formData.organizationInn) fields.push(`Организация ИНН: ${formData.organizationInn}`)
    if (formData.organization) {
      const item = organizationOptions.value.find(item => item.id === formData.organization)
      fields.push(`Организация: ${item ? item.title : formData.organization}`)
    }
    if (formData.organizationAccount) fields.push(`Счет организации: ${formData.organizationAccount}`)
    if (formData.counterpartyInn) fields.push(`Контрагент ИНН: ${formData.counterpartyInn}`)
    if (formData.counterpartyCode) fields.push(`Контрагент (код): ${formData.counterpartyCode}`)
    if (formData.counterpartyAccount) fields.push(`Счет контрагента: ${formData.counterpartyAccount}`)
    if (formData.partnerCode) fields.push(`Партнер (код): ${formData.partnerCode}`)
    if (formData.partner) fields.push(`Партнер: ${formData.partner}`)
    if (formData.paymentDetails) {
      const item = paymentDetailsOptions.value.find(item => item.id === formData.paymentDetails)
      fields.push(`Детализация расчётов: ${item ? item.title : formData.paymentDetails}`)
    }
    if (formData.currency) {
      const item = currencyOptions.value.find(item => item.id === formData.currency)
      fields.push(`Валюта: ${item ? item.title : formData.currency}`)
    }
    fields.push(`Оплата в иностранной валюте: ${formData.foreignCurrencyPayment ? 'Да' : 'Нет'}`)
    fields.push(`Сумма договора фиксирована: ${formData.fixedContractAmount ? 'Да' : 'Нет'}`)
    fields.push(`Разрешена работа с дочерними партнерами: ${formData.allowSubsidiaryPartners ? 'Да' : 'Нет'}`)
    if (formData.labeledProducts) {
      const item = labeledProductsOptions.value.find(item => item.id === formData.labeledProducts)
      fields.push(`Маркируемая продукция: ${item ? item.title : formData.labeledProducts}`)
    }
    fields.push(`Запрещать отгрузку: ${formData.prohibitShipment ? 'Да' : 'Нет'}`)
    fields.push(`Не отгружать при сумме задолженности: ${formData.dontShipOnDebt ? 'Да' : 'Нет'}`)
    if (formData.debtAmount) fields.push(`Сумма задолженности: ${formData.debtAmount}`)
    if (formData.vatRate) {
      const item = vatRateOptions.value.find(item => item.id === formData.vatRate)
      fields.push(`Ставка НДС: ${item ? item.title : formData.vatRate}`)
    }
    if (formData.financialGroup) {
      const item = financialGroupOptions.value.find(item => item.id === formData.financialGroup)
      fields.push(`Группа фин. учета: ${item ? item.title : formData.financialGroup}`)
    }
    if (formData.ddsArticle) {
      const item = ddsArticleOptions.value.find(item => item.id === formData.ddsArticle)
      fields.push(`Статья ДДС: ${item ? item.title : formData.ddsArticle}`)
    }
    if (formData.debtClassification) {
      const item = debtClassificationOptions.value.find(item => item.id === formData.debtClassification)
      fields.push(`Классификация задолженности: ${item ? item.title : formData.debtClassification}`)
    }
    if (formData.vatDeclarationOperation) {
      const item = vatDeclarationOperationOptions.value.find(item => item.id === formData.vatDeclarationOperation)
      fields.push(`Операция декларации по НДС: ${item ? item.title : formData.vatDeclarationOperation}`)
    }
    if (formData.activityDirection) fields.push(`Направление деятельности: ${formData.activityDirection}`)
  }
  
  // Добавляем поля для Банковских счетов
  else if (formData.object === '16941') {
    if (formData.bankAccountStatus) {
      const item = bankAccountStatusOptions.value.find(item => item.id === formData.bankAccountStatus)
      fields.push(`Статус: ${item ? item.title : formData.bankAccountStatus}`)
    }
    if (formData.counterpartyInn) fields.push(`Контрагент ИНН: ${formData.counterpartyInn}`)
    if (formData.counterparty) fields.push(`Контрагент: ${formData.counterparty}`)
    if (formData.bankType) {
      const item = bankTypeOptions.value.find(item => item.id === formData.bankType)
      fields.push(`Вид банка: ${item ? item.title : formData.bankType}`)
    }
    
    if (formData.bankType === 'national') {
      if (formData.bik) fields.push(`БИК: ${formData.bik}`)
      if (formData.bankName) fields.push(`Наименование банка: ${formData.bankName}`)
      if (formData.currency) {
        const item = currencyOptions.value.find(item => item.id === formData.currency)
        fields.push(`Валюта: ${item ? item.title : formData.currency}`)
      }
      if (formData.accountNumber) fields.push(`Расчетный счет: ${formData.accountNumber}`)
      if (formData.correspondentAccount) fields.push(`Корреспондентский счет: ${formData.correspondentAccount}`)
    } else if (formData.bankType === 'international') {
      if (formData.swift) fields.push(`SWIFT: ${formData.swift}`)
      if (formData.bankName) fields.push(`Наименование банка: ${formData.bankName}`)
      if (formData.bankRegistrationCity) fields.push(`Страна регистрации и город: ${formData.bankRegistrationCity}`)
      if (formData.bankAddress) fields.push(`Адрес банка: ${formData.bankAddress}`)
      if (formData.currency) {
        const item = currencyOptions.value.find(item => item.id === formData.currency)
        fields.push(`Валюта: ${item ? item.title : formData.currency}`)
      }
      if (formData.accountNumber) fields.push(`Расчетный счет: ${formData.accountNumber}`)
      if (formData.correspondentAccount) fields.push(`Корреспондентский счет: ${formData.correspondentAccount}`)
    }
  }
  return fields.join('\n')
}

// Функция добавления комментария в таймлайн
const addTimelineComment = async (itemId) => {
  return new Promise((resolve, reject) => {
    const commentText = getAllRequestFields()
    
    console.log('Текст комментария для таймлайна:', commentText)
    
    if (typeof BX24 === 'undefined') {
      console.log('Режим разработки: добавляется комментарий в таймлайн')
      setTimeout(() => resolve(), 500)
      return
    }
    
    const fields = {
      "ENTITY_ID": itemId,
      "ENTITY_TYPE": "DYNAMIC_1046",
      "COMMENT": commentText,
    }
    
    BX24.callMethod(
      "crm.timeline.comment.add",
      { fields: fields },
      (res) => {
        if (res.error()) {
          console.error('Ошибка при добавлении комментария:', res.error())
          reject(new Error(res.error().error_description || 'Ошибка добавления комментария'))
        } else {
          console.log('Комментарий добавлен в таймлайн')
          resolve()
        }
      }
    )
  })
}

// Загрузка опций из Bitrix при монтировании
onMounted(async () => {
  await loadBitrixOptions()
})

const loadCurrencies = async() => {
  currencyOptions.value = await callApi("crm.currency.list", null, null);
  registrationCountryOptions.value = await getListElements(459, null, null);
}

// Функция загрузки опций из Bitrix
const loadBitrixOptions = async () => {
  isLoadingRequestTypes.value = true
  try {
    if (typeof BX24 === 'undefined') {
      console.log('Режим разработки: используем статические опции')
      nsiObjectOptions.value = []
      return
    }
    
    const fields = await getSmartProcessFields();
    updateOptionsFromBitrixFields(fields);
    loadCurrencies();
  } catch (error) {
    console.error('Ошибка при загрузке опций из Bitrix:', error)
    submitStatus.value = {
      type: 'error',
      message: 'Ошибка при загрузке списков из системы'
    }
  } finally {
    isLoadingRequestTypes.value = false
  }
}

// Получение полей смарт-процесса из Bitrix
const getSmartProcessFields = () => {
  return new Promise((resolve, reject) => {
    BX24.callMethod(
      'crm.item.fields',
      { entityTypeId: 1046 },
      (res) => {
        if (res.error()) {
          reject(new Error(res.error().error_description || 'Ошибка получения полей'))
        } else {
          resolve(res.data().fields)
        }
      }
    )
  })
}

// Обновление опций из полей Bitrix
const updateOptionsFromBitrixFields = async(fields) => {
  console.log('Полученные поля из Bitrix:', fields);
  const fieldMapping = {
    'ufCrm63_1765788575681': { // Тип заявки
      target: requestTypeOptions,
      title: 'Тип заявки'
    },/*
    'ufCrm63_1765184921808': { // Вид заявки
      target: requestViewOptions,
      title: 'Вид заявки'
    },*/
    'ufCrm63_1765789339357': { // Объект MDM
      target: nsiObjectOptions,
      title: 'Объект MDM'
    },
    'ufCrm63_1766580111': { // Вид контрагента
      target: counterpartyTypeOptions,
      title: 'Вид контрагента'
    }
  };
  
  Object.keys(fieldMapping).forEach(fieldCode => {
    const field = fields[fieldCode];
    const mapping = fieldMapping[fieldCode];

    if (field && field.type === 'enumeration' && field.items) {
      console.log(`Обрабатываем поле "${mapping.title}" (${fieldCode}):`, field);

      const items = field.items.map(item => ({
        id: item.ID.toString(),
        title: item.VALUE,
        bitrixId: item.ID.toString()
      }));

      mapping.target.value = items;
      
      console.log(`Обновлены опции для "${mapping.title}":`, items);
    } else {
      console.warn(`Поле ${fieldCode} (${mapping.title}) не найдено или не является списком`);
    }
  });

  businessRegionOptions.value = await callApi('crm.item.list', null, ["title", "id"], 170);
  console.log(businessRegionOptions.value);
  console.log('Все обработанные опции:');
  console.log('- Тип заявки:', requestTypeOptions.value);
  console.log('- Объект MDM:', nsiObjectOptions.value);
  console.log('- Вид контрагента:', counterpartyTypeOptions.value);
}
const encodeFilesToBase64 = (files) => {
  return Promise.all(
    files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = () => {
          resolve({
            name: file.name,
            base64: reader.result.split(',')[1] // чистый base64 без префикса
          })
        }
        
        reader.onerror = error => reject(error)
        reader.readAsDataURL(file)
      })
    })
  )
}
// Функция создания заявки в Bitrix24 (нужно будет адаптировать под новые поля)
const createBitrixRequest = async () => {
  return new Promise(async (resolve, reject) => {
    // Подготавливаем данные для отправки
    const fields = {
      entityTypeId: 1046,
      fields: {
        // Основные поля (из шага 1)
        'ufCrm63_1765788575681': formData.type,
        'ufCrm63_1765184921808': formData.view,
        'ufCrm63_1765789339357': formData.object,
        'ufCrm63_1765184971082': getAllRequestFields() || '',
      }
    }

    // Добавляем дополнительные поля в зависимости от объекта НСИ и типа заявки
    if (formData.object === '16937') { // Контрагенты
      fields.fields['ufCrm63_1766580111'] = formData.counterpartyType // Вид контрагента
      
      if (formData.type === '16931') { // Добавление
        fields.fields['ufCrm63_1765788575689'] = formData.inn // ИНН
        fields.fields['ufCrm63_1765788575691'] = formData.name // Наименование
        fields.fields['ufCrm63_1765788575693'] = formData.shortName // Сокр. наименование
        fields.fields['ufCrm63_1765788575695'] = formData.legalAddress // Юридический адрес
        fields.fields['ufCrm63_1765788575697'] = formData.actualAddress // Фактический адрес
        fields.fields['ufCrm63_1765788575699'] = formData.phone // Телефон
        fields.fields['ufCrm63_1765788575701'] = formData.email // Email
        fields.fields['ufCrm63_1765788575703'] = formData.contactPerson // Контактное лицо
        fields.fields['ufCrm63_1765788575705'] = formData.partner // Партнер
        fields.fields['ufCrm63_1765788575707'] = formData.partnerCode // Партнер (код)
        fields.fields['ufCrm63_1765788575709'] = formData.hasFile ? 'Y' : 'N' // Файл приложен
        
        // Поля в зависимости от вида контрагента
        if (formData.counterpartyType === '16953') { // ЮЛ
          fields.fields['ufCrm63_1765788575711'] = formData.kpp // КПП
          fields.fields['ufCrm63_1765788575713'] = formData.ogrn // ОГРН
          fields.fields['ufCrm63_1765788575715'] = formData.okpo // ОКПО
        } else if (formData.counterpartyType === '16954') { // ОПЮЛ
          fields.fields['ufCrm63_1765788575711'] = formData.kpp // КПП
          fields.fields['ufCrm63_1765788575713'] = formData.ogrn // ОГРН
          fields.fields['ufCrm63_1765788575717'] = formData.headInn // ИНН Головного к/а
          fields.fields['ufCrm63_1765788575719'] = formData.headCounterparty // Головной контрагент
        } else if (formData.counterpartyType === '16957') { // ФЛ
          fields.fields['ufCrm63_1765788575721'] = formData.identityDocument // Документ удост. личность
        } else if (formData.counterpartyType === '16955') { // ИП
          fields.fields['ufCrm63_1765788575723'] = formData.ogrnip // ОГРНИП
        } else if (formData.counterpartyType === '16959') { // ЮЛН
          fields.fields['ufCrm63_1765788575725'] = formData.registrationCountry // Страна регистрации
          fields.fields['ufCrm63_1765788575727'] = formData.registrationNumber // Рег. номер
          fields.fields['ufCrm63_1765788575729'] = formData.taxNumber // Налоговый номер
        }
      }
    } else if (formData.object === '16939') { // Партнеры
      fields.fields['ufCrm63_1766580113'] = formData.partnerType // Вид партнера
      
      if (formData.type === '16931') { // Добавление
        fields.fields['ufCrm63_1765788575731'] = formData.name // Наименование
        fields.fields['ufCrm63_1765788575733'] = formData.partnerCode // Партнер (код)
        fields.fields['ufCrm63_1765788575735'] = formData.partner // Партнер

        if (formData.partnerType === '16961') { // КП
          fields.fields['ufCrm63_1765788575739'] = formData.phone // Телефон
          fields.fields['ufCrm63_1765788575741'] = formData.email // Email
          fields.fields['ufCrm63_1765788575743'] = formData.businessRegion ? formData.businessRegion.join(', ') : '' // Бизнес-регион
          fields.fields['ufCrm63_1765788575745'] = formData.relationshipType ? formData.relationshipType.join(', ') : '' // Тип отношений
          fields.fields['ufCrm63_1765788575747'] = formData.legalAddress // Юридический адрес
          fields.fields['ufCrm63_1765788575749'] = formData.actualAddress // Фактический адрес
          fields.fields['ufCrm63_1765788575751'] = formData.categoryB2 // Категория B2
          fields.fields['ufCrm63_1765788575753'] = formData.categoryCA // Категория СА
          fields.fields['ufCrm63_1765788575755'] = formData.ckg // ЦКГ
          fields.fields['ufCrm63_1765788575757'] = formData.ckgB2B // ЦКГ B2B
        } else if (formData.partnerType === '16963') { // ЧЛ
          fields.fields['ufCrm63_1765788575759'] = formData.birthDate // Дата рождения
          fields.fields['ufCrm63_1765788575761'] = formData.gender // Пол
          fields.fields['ufCrm63_1765788575763'] = formData.phone // Телефон
          fields.fields['ufCrm63_1765788575765'] = formData.email // Email
          fields.fields['ufCrm63_1765788575767'] = formData.isNonResident ? 'Y' : 'N' // ЮЛН
          
          if (formData.isNonResident) {
            fields.fields['ufCrm63_1765788575769'] = formData.registrationCountry // Страна регистрации
            fields.fields['ufCrm63_1765788575771'] = formData.registrationNumber // Рег. номер
            fields.fields['ufCrm63_1765788575773'] = formData.taxNumber // Налоговый номер
          }
        }
      }
    }

    console.log(formData.hasFile);
    let files = await encodeFilesToBase64(formData.hasFile);

    files = files.map((file) => [file.name, file.base64]);
    console.log(files);
    fields.fields['ufCrm63_1765184954446'] = files;
    BX24.callMethod(
      'crm.item.add',
      fields,
      (res) => {
        if (res.error()) {
          console.error('Ошибка при создании заявки:', res.error())
          reject(new Error(res.error().error_description || 'Ошибка создания заявки'))
        } else {
          console.log('Заявка успешно создана:', res.data())
          resolve(res)
        }
      }
    )
  })
}

// Основная функция отправки формы
const submitForm = async () => {
  const { valid } = await form.value.validate()
  if (!valid) {
    submitStatus.value = {
      type: 'error',
      message: 'Пожалуйста, заполните все обязательные поля'
    }
    return
  }
  
  isSubmitting.value = true
  
  try {
    const createResponse = await createBitrixRequest()
    const itemId = createResponse.data().item.id
    
    await addTimelineComment(itemId)
    
    submitStatus.value = {
      type: 'success',
      message: `Заявка №${itemId} создана и передана в обработку!\nСпасибо за обращение!`
    }
    
    resetForm()
    
  } catch (error) {
    console.error('Ошибка при отправке заявки:', error)
    submitStatus.value = {
      type: 'error',
      message: error.message || 'Ошибка при отправке заявки в Bitrix24'
    }
  } finally {
    isSubmitting.value = false
  }
}

// Сброс формы
const resetForm = () => {
  const currentDate = formData.date
  
  Object.keys(formData).forEach(key => {
    if (key === 'date') {
      formData[key] = new Date().toLocaleDateString('ru-RU')
    } else if (key === 'additionalPhones' || key === 'additionalEmails') {
      formData[key] = []
    } else if (key === 'businessRegion' || key === 'relationshipType') {
      formData[key] = []
    } else if (typeof formData[key] === 'boolean') {
      formData[key] = false
    } else {
      formData[key] = ''
    }
  })
  
  currentStep.value = 1
  if (form.value) {
    form.value.resetValidation()
  }
}
</script>

<style scoped>
.v-container {
  max-width: 100% !important;
}

.v-card {
  min-height: 100vh;
}

.v-stepper-header {
  width: 100%;
}

.v-stepper-item {
  text-align: center;
}

.v-alert {
  white-space: pre-line;
}
</style>