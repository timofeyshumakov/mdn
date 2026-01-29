<template>
  <v-app>
    <LoadingProgress 
      v-if="isLoading"
      :message="loadingMessage"
      :duration="2500"
      @complete="onLoadingComplete"
    />
    <v-main>
      <v-container fluid class="pa-0">
        <v-card class="mx-auto" flat>
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
                  item-title="title"
                  item-value="id"
                  label="Вид контрагента"
                  placeholder="Укажите: правовой статус контрагента"
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
                
                <!-- Для типа заявки "Ошибка/доработка" (16935) -->
                <div v-if="formData.type === '16935'">
                  <!-- Шаг 2: Описание ошибки и файлы -->
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
                    
                    <!-- Файлы -->
                    <v-file-input
                      v-model="formData.hasFile"
                      label="Файлы"
                      placeholder="Загрузите файлы или скриншоты для описания ошибки..."
                      multiple
                      chips
                      counter
                      show-size
                      prepend-icon="mdi-paperclip"
                      :rules="fileRules"
                      variant="outlined"
                      class="mb-6"
                    ></v-file-input>
                  </div>
                </div>

                <!-- Для типов заявки "Добавление" (16931) и "Изменение" (16933) -->
                <div v-else>
                  <!-- Поля для объекта "Банковские счета" -->
                  <div v-if="formData.object === '16941'">
                      <!-- Шаг 2: Основные данные -->
                      <div v-if="stepData.stepNumber === 2">
                        <!-- Статус -->
                        <v-autocomplete
                          v-model="formData.bankAccountStatus"
                          :items="bankAccountStatusOptions"
                          label="Статус"
                          placeholder="Укажите: значение из выпадающего списка"
                          :rules="[v => !!v || 'Статус обязателен']"
                          item-title="title"
                          item-value="id"
                          variant="outlined"
                          required
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- Контрагент -->
                        <v-text-field
                          v-model="formData.counterparty"
                          label="Контрагент"
                          placeholder="Укажите: наименование контрагента (пример: Ромашка ООО)"
                          :rules="[v => !!v || 'Контрагент обязателен']"
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
                          :rules="getInnRules()"
                          maxlength="12"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <!-- Вид банка -->
                        <v-autocomplete
                          v-model="formData.bankType"
                          :items="bankTypeOptions"
                          label="Вид банка"
                          placeholder="Укажите: значение из выпадающего списка"
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
                        <div v-if="formData.bankType === 'national' || formData.bankType === '16971'">
                          <!-- БИК -->
                          <v-text-field
                            v-model="formData.bik"
                            label="БИК"
                            placeholder="Укажите: цифровой код идентификации банка (9 символов)"
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
                            placeholder="Укажите: наименование банка (пример: СИБИРСКИЙ БАНК ПАО СБЕРБАНК)"
                            :rules="[v => !!v || 'Наименование банка обязательно']"
                            :maxlength="150"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Валюта -->
                          <v-autocomplete
                            v-model="formData.currency"
                            :items="currencyOptions"
                            label="Валюта"
                            placeholder="Укажите: валюту расчетов"
                            :rules="[v => !!v || 'Валюта обязательна']"
                            item-title="FULL_NAME"
                            item-value="CURRENCY"
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
                          
                          <!-- Адрес -->
                          <v-text-field
                            v-model="formData.bankAddress"
                            label="Адрес банка"
                            placeholder="Укажите: адрес в порядке индекс, область, город, улица, дом, квартира/ помещение"
                            :maxlength="250"
                            variant="outlined"
                            counter
                            class="mb-6"
                          ></v-text-field>
                        </div>
                        
                        <!-- Для международного банка -->
                        <div v-else-if="formData.bankType === 'international' || formData.bankType === '16973'">
                          <!-- SWIFT -->
                          <v-text-field
                            v-model="formData.swift"
                            label="SWIFT"
                            placeholder="Укажите: код идентификации банка для международных операций (8-11 символов)"
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
                            placeholder="Укажите: наименование банка (пример: СИБИРСКИЙ БАНК ПАО СБЕРБАНК)"
                            :rules="[v => !!v || 'Наименование банка обязательно']"
                            :maxlength="150"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Страна регистрации и город -->
                          <v-text-field
                            v-model="formData.bankRegistrationCity"
                            label="Страна регистрации и город"
                            placeholder="Укажите: страну регистрации и город"
                            :rules="[v => !!v || 'Страна и город обязательны']"
                            :maxlength="100"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Адрес -->
                          <v-text-field
                            v-model="formData.bankAddress"
                            label="Адрес банка"
                            placeholder="Укажите: адрес в порядке индекс, область, город, улица, дом, квартира/ помещение"
                            :maxlength="250"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Валюта -->
                          <v-autocomplete
                            v-model="formData.currency"
                            :items="currencyOptions"
                            label="Валюта"
                            placeholder="Укажите: валюту расчетов"
                            :rules="[v => !!v || 'Валюта обязательна']"
                            item-title="FULL_NAME"
                            item-value="CURRENCY"
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
                            class="mb-6"
                          ></v-text-field>
                        </div>
                      </div>
                      
                      <!-- Шаг 4: Файлы -->
                      <div v-if="stepData.stepNumber === 4">
                        <!-- Файлы -->
                        <v-file-input
                          v-model="formData.hasFile"
                          label="Файлы"
                          placeholder="Прикрепите: скан-копию с корректной информацией, печатями (если применимо)"
                          multiple
                          chips
                          counter
                          show-size
                          prepend-icon="mdi-paperclip"
                          :rules="fileRules"
                          variant="outlined"
                          class="mb-6"
                        ></v-file-input>
                      </div>
                    </div>

                  <!-- Поля для объекта "Контрагенты" -->
                  <div v-else-if="formData.object === '16937'">
                    <!-- Поля для добавления и изменения контрагента -->
                    <!-- Шаг 2: Основные данные контрагента -->
                    <div v-if="stepData.stepNumber === 2">
                          <!-- Партнер -->
                          <v-text-field
                            v-model="formData.partner"
                            label="Партнер"
                            placeholder="Укажите наименование партнера из 1С ERP"
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
                          <!-- Вид контрагента -->
                          <v-autocomplete
                            v-model="formData.counterpartyType"
                            :items="counterpartyTypeOptions"
                            label="Вид контрагента"
                            placeholder="Выберите вид контрагента"
                            :rules="[v => !!v || 'Вид контрагента обязателен']"
                            item-title="title"
                            item-value="id"
                            variant="outlined"
                            required
                            class="mb-4"
                            @update:model-value="resetCounterpartySpecificFields"
                          ></v-autocomplete>
                          
                          <!-- ИНН (зависит от вида контрагента) -->
                          <v-text-field
                            v-model="formData.inn"
                            label="ИНН"
                            placeholder="Введите ИНН"
                            :rules="getInnRules()"
                            maxlength="12"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Наименование -->
                          <v-text-field
                            v-model="formData.name"
                            label="Наименование"
                            placeholder="Укажите полное наименование контрагента"
                            :rules="[v => !!v || 'Наименование обязательно']"
                            :maxlength="100"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Сокр. наименование -->
                          <v-text-field
                            v-model="formData.shortName"
                            label="Сокр. наименование"
                            placeholder="Укажите сокращенное наименование"
                            :rules="[v => !!v || 'Сокращенное наименование обязательно']"
                            :maxlength="250"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>

                          <!-- Конкретные поля для ЮЛ и ОПЮЛ -->
                          <div v-if="['17941', '17943'].includes(formData.counterpartyType)">
                            <!-- КПП -->
                            <v-text-field
                              v-model="formData.kpp"
                              label="КПП"
                              placeholder="Введите КПП"
                              :rules="kppRules"
                              :maxlength="9"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                            
                            <!-- ОГРН -->
                            <v-text-field
                              v-model="formData.ogrn"
                              label="ОГРН"
                              placeholder="Введите ОГРН"
                              :rules="ogrnRules"
                              :maxlength="15"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                            
                            <!-- ОКПО -->
                            <v-text-field
                              v-model="formData.okpo"
                              label="ОКПО"
                              placeholder="Введите ОКПО"
                              :rules="okpoRules"
                              :maxlength="10"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                          </div>

                          <!-- Поля для ОПЮЛ -->
                          <div v-if="formData.counterpartyType === '17943'">
                            <!-- ИНН Головного контрагента -->
                            <v-text-field
                              v-model="formData.headInn"
                              label="ИНН Головного контрагента"
                              placeholder="Введите ИНН головного контрагента"
                              :rules="[v => !!v || 'ИНН головного контрагента обязателен']"
                              maxlength="12"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                            
                            <!-- Головной контрагент -->
                            <v-text-field
                              v-model="formData.headCounterparty"
                              label="Головной контрагент"
                              placeholder="Укажите головного контрагента"
                              :rules="[v => !!v || 'Головной контрагент обязателен']"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                          </div>

                          <!-- Поле для ФЛ -->
                          <div v-if="formData.counterpartyType === '17945'">
                            <v-text-field
                              v-model="formData.identityDocument"
                              label="Документ удост. личность"
                              placeholder="Укажите реквизиты документа, удостоверяющего личность"
                              :rules="[v => !!v || 'Документ обязателен']"
                              :maxlength="150"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                          </div>

                          <!-- Поле для ИП -->
                          <div v-if="formData.counterpartyType === '17947'">
                            <v-text-field
                              v-model="formData.ogrnip"
                              label="ОГРНИП"
                              placeholder="Введите ОГРНИП"
                              :rules="ogrnipRules"
                              :maxlength="15"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                          </div>

                          <!-- Поля для ЮЛН -->
                          <div v-if="formData.counterpartyType === '17949'">
                            <!-- Страна регистрации -->
                            <v-autocomplete
                              v-model="formData.registrationCountry"
                              :items="registrationCountryOptions"
                              item-title="NAME"
                              item-value="NAME"
                              label="Страна регистрации"
                              placeholder="Выберите страну регистрации"
                              :rules="[v => !!v || 'Страна регистрации обязательна']"
                              variant="outlined"
                              class="mb-4"
                            ></v-autocomplete>
                            
                            <!-- Рег. номер -->
                            <v-text-field
                              v-model="formData.registrationNumber"
                              label="Рег. номер"
                              placeholder="Укажите регистрационный номер в стране регистрации"
                              :rules="[v => !!v || 'Регистрационный номер обязателен']"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                            
                            <!-- Налоговый номер -->
                            <v-text-field
                              v-model="formData.taxNumber"
                              label="Налоговый номер"
                              placeholder="Укажите налоговый номер страны регистрации"
                              :rules="[v => !!v || 'Налоговый номер обязателен']"
                              :maxlength="50"
                              variant="outlined"
                              counter
                              class="mb-4"
                            ></v-text-field>
                          </div>
                          
                          <!-- Юридический адрес -->
                          <v-text-field
                            v-model="formData.legalAddress"
                            label="Юридический адрес"
                            placeholder="Укажите юридический адрес"
                            :rules="[v => !!v || 'Юридический адрес обязателен']"
                            :maxlength="250"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Фактический адрес -->
                          <v-text-field
                            v-model="formData.actualAddress"
                            label="Фактический адрес"
                            placeholder="Укажите фактический адрес (если отличается от юридического)"
                            :maxlength="250"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Телефон -->
                          <v-text-field
                            v-model="formData.phone"
                            label="Телефон"
                            v-mask="'+7 (###) ###-##-##'"
                            placeholder="Укажите номер в формате +7 (999) 999 99 99"
                            :rules="phoneRules"
                            :maxlength="20"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Электронная почта -->
                          <v-text-field
                            v-model="formData.email"
                            label="Электронная почта"
                            placeholder="Укажите email в формате name@domain.com"
                            :rules="emailRules"
                            :maxlength="50"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <!-- Контактное лицо -->
                          <v-text-field
                            v-model="formData.contactPerson"
                            label="Контактное лицо"
                            placeholder="Укажите ФИО контактного лица"
                            :rules="[v => !!v || 'Контактное лицо обязательно']"
                            :maxlength="150"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                        </div>
                        
                        <!-- Шаг 3: Файлы -->
                        <div v-if="stepData.stepNumber === 3">
                          <v-file-input
                            v-model="formData.hasFile"
                            label="Файлы"
                            placeholder="Прикрепите необходимые документы"
                            multiple
                            chips
                            counter
                            show-size
                            prepend-icon="mdi-paperclip"
                            :rules="fileRules"
                            variant="outlined"
                            class="mb-6"
                          ></v-file-input>
                        </div>
                  </div>
                  
                  <!-- Поля для объекта "Партнеры" -->
                  <div v-else-if="formData.object === '16939'">
                    <!-- Шаг 2: Данные партнера -->
                    <div v-if="stepData.stepNumber === 2">
                      <!-- Поля для КП (компания) -->
                      <div v-if="formData.partnerType === 'КП (компания)' || formData.partnerType === '16961'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Укажите: наименование (пример: Ромашка ООО)"
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
                              v-mask="'+7 (###) ###-##-##'"
                              placeholder="Укажите: номер в формате +7 (999) 999 99 99"
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
                              placeholder="Укажите: электронную почту в формате '…...@.....'"
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
                          placeholder="Укажите: регион или область России"
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
                          placeholder="Укажите: тип взаимоотношений с партнером (выпадающий список)"
                          variant="outlined"
                          multiple
                          chips
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <v-text-field
                          v-model="formData.legalAddress"
                          label="Юридический адрес"
                          placeholder="Укажите: адрес в порядке индекс, область, город, улица, дом, квартира/ помещение"
                          :rules="[v => !!v || 'Юридический адрес обязателен']"
                          :maxlength="250"
                          variant="outlined"
                          counter
                          class="mb-4"
                        ></v-text-field>
                        
                        <v-text-field
                          v-model="formData.actualAddress"
                          label="Фактический адрес"
                          placeholder="Укажите: адрес в порядке индекс, область, город, улица, дом, квартира/ помещение"
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
                          placeholder="Укажите: дополнительную аналитику по категории"
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- Категория СА -->
                        <v-autocomplete
                          v-model="formData.categoryCA"
                          :items="categoryCAOptions"
                          label="Категория СА"
                          placeholder="Укажите: дополнительную аналитику по категории"
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- ЦКГ -->
                        <v-autocomplete
                          v-model="formData.ckg"
                          :items="ckgOptions"
                          label="ЦКГ"
                          placeholder="Укажите: целевую клиентскую группу (выпадающий списко)"
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                        
                        <!-- ЦКГ B2B -->
                        <v-autocomplete
                          v-model="formData.ckgB2B"
                          :items="ckgB2BOptions"
                          label="ЦКГ B2B"
                          placeholder="Укажите: аналитика по целевым клиентским группам для B2B (выпадающий список)"
                          variant="outlined"
                          class="mb-4"
                        ></v-autocomplete>
                      </div>
                      
                      <!-- Поля для ЧЛ (частное лицо) -->
                      <div v-else-if="formData.partnerType === '16963'">
                        <v-text-field
                          v-model="formData.name"
                          label="Наименование"
                          placeholder="Укажите: наименование (пример: Ромашка ООО)"
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
                              v-mask="'+7 (###) ###-##-##'"
                              placeholder="Укажите: номер в формате +7 (999) 999 99 99"
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
                              placeholder="Укажите: электронную почту в формате '…...@.....'"
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
                            placeholder="Укажите: страну регистрации контрагента"
                            :rules="[v => !!v || 'Страна регистрации обязательна']"
                            variant="outlined"
                            class="mb-4"
                          ></v-autocomplete>
                          
                          <v-text-field
                            v-model="formData.registrationNumber"
                            label="Рег. номер"
                            placeholder="Укажите: регистрационный номер в стране регистрации"
                            :rules="[v => !!v || 'Регистрационный номер обязателен']"
                            :maxlength="50"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                          
                          <v-text-field
                            v-model="formData.taxNumber"
                            label="Налоговый номер"
                            placeholder="Укажите: налоговый номер страны регистрации"
                            :rules="[v => !!v || 'Налоговый номер обязателен']"
                            :maxlength="50"
                            variant="outlined"
                            counter
                            class="mb-4"
                          ></v-text-field>
                        </div>
                        
                        <v-checkbox
                          v-model="formData.isNonResident"
                          label="ЮЛН (Юридическое лицо нерезедент)"
                          class="mb-4"
                        ></v-checkbox>
                        
                        <v-text-field
                          v-model="formData.partner"
                          label="Партнер"
                          placeholder="Укажите: наименование из 1С ERP"
                          :rules="[v => !!v || 'Партнер обязателен']"
                          :maxlength="150"
                          variant="outlined"
                          counter
                          class="mb-6"
                        ></v-text-field>
                      </div>
                    </div>
                    
                    <!-- Шаг 3: Файлы -->
                    <div v-if="stepData.stepNumber === 3">
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Файлы"
                        placeholder="Прикрепите: скан-копию с корректной информацией, печатями (если применимо)"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                        class="mb-6"
                      ></v-file-input>
                    </div>
                  </div>
                  
                  <!-- Поля для объекта "Типовые соглашения" -->
                  <div v-else-if="formData.object === '16963'">
                    <!-- Шаг 2: Данные типового соглашения -->
                    <div v-if="stepData.stepNumber === 2">
                      <h3 class="text-h6 mb-4">Данные типового соглашения</h3>
                      <!-- Основание -->
                      <v-text-field
                        v-model="formData.typicalAgreementBasis"
                        label="Основание"
                        placeholder="Укажите: основание для отражения в системе (Укажите № приказа)"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-6"
                      ></v-text-field>
                      <!-- файл -->
                      <v-file-input
                        v-model="formData.typicalAgreementBasisFile"
                        label="Файлы"
                        placeholder="Прикрепите: файл-основание"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        variant="outlined"
                        class="mb-4"
                      ></v-file-input>
                      <!-- Наименование -->
                      <v-text-field
                        v-model="formData.typicalAgreementName"
                        label="Наименование"
                        placeholder="Укажите: наименование соглашения (пример: КК 30%, 70% на 35КД)"
                        :rules="[v => !!v || 'Наименование обязательно']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Условия -->
                      <v-textarea
                        v-model="formData.typicalAgreementTerms"
                        label="Условия"
                        placeholder="Укажите: условия соглашения (размер предоплаты, количество дней отсрочки и др.)"
                        :rules="[v => !!v || 'Условия обязательны']"
                        :maxlength="150"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Операция (соглашение) -->
                      <v-autocomplete
                        v-model="formData.typicalAgreementOperation"
                        :items="agreementOperationOptions"
                        label="Операция (соглашение)"
                        placeholder="Укажите: тип операции (выпадающий список)"
                        :rules="[v => !!v || 'Операция обязательна']"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Подразделение -->
                      <v-text-field
                        v-model="formData.typicalAgreementDepartment"
                        label="Подразделение"
                        placeholder="Укажите: Ответственное подразделение"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия с -->
                      <v-text-field
                        v-model="formData.typicalAgreementPeriodFrom"
                        label="Период действия с"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия по -->
                      <v-checkbox
                        v-model="formData.typicalAgreementPeriodTo"
                        label="Период действия по (бессрочное)"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Валюта -->
                      <v-autocomplete
                        v-model="formData.typicalAgreementCurrency"
                        :items="currencyOptions"
                        label="Валюта"
                        placeholder="Укажите: валюту расчетов"
                        item-title="FULL_NAME"
                        item-value="CURRENCY"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      <!-- График -->
                      <v-textarea
                        v-model="formData.typicalAgreementSchedule"
                        label="График"
                        placeholder="Укажите: как оплачивается продукция (отсрочка по дням, предоплата в % от суммы)"
                        :maxlength="150"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Дополнительно -->
                      <v-textarea
                        v-model="formData.typicalAgreementAdditional"
                        label="Дополнительно"
                        placeholder="Укажите: дополнительную информацию по заявке"
                        :maxlength="250"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                    </div>
                  </div>

                  <!-- Поля для объекта "Индивидуальные соглашения" -->
                  <div v-else-if="formData.object === '17957'">
                    <!-- Шаг 2: Данные индивидуального соглашения -->
                    <div v-if="stepData.stepNumber === 2">
                      <h3 class="text-h6 mb-4">Данные индивидуального соглашения</h3>
                      <!-- Основание -->
                      <v-text-field
                        v-model="formData.individualAgreementBasis"
                        label="Основание"
                        placeholder="Укажите: основание для отражения в системе (Укажите № приказа)"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Основание (файл) -->
                      <v-file-input
                        v-model="formData.individualAgreementBasisFile"
                        label="Файлы"
                        placeholder="Прикрепите: файл-основание"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        variant="outlined"
                        class="mb-6"
                      ></v-file-input>
                      <!-- Наименование -->
                      <v-text-field
                        v-model="formData.individualAgreementName"
                        label="Наименование"
                        placeholder="Укажите: наименование соглашения с номером и датой (пример: ИСВ с АВИИТ ООО, скидка 0% и Отсрочка после отгрузки 90 КД (100%))"
                        :rules="[v => !!v || 'Наименование обязательно']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Партнер -->
                      <v-text-field
                        v-model="formData.individualAgreementPartner"
                        label="Партнер"
                        placeholder="Укажите: наименование из 1С ERP"
                        :rules="[v => !!v || 'Партнер обязателен']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Организация -->
                      <v-autocomplete
                        v-model="formData.individualAgreementOrganization"
                        :items="organizationOptions"
                        label="Организация"
                        placeholder="Укажите: наименование из 1С ERP (ОРТОНИКА ООО)"
                        :rules="[v => !!v || 'Организация обязательна']"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Дата -->
                      <v-text-field
                        v-model="formData.individualAgreementDate"
                        label="Дата"
                        type="date"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия с -->
                      <v-text-field
                        v-model="formData.individualAgreementPeriodFrom"
                        label="Период действия с"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия по -->
                      <v-checkbox
                        v-model="formData.individualAgreementPeriodTo"
                        label="Период действия по (бессрочное)"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Номер -->
                      <v-text-field
                        v-model="formData.individualAgreementNumber"
                        label="Номер"
                        placeholder="Укажите: номер соглашения согласно подписанной версии"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Операция (соглашение) -->
                      <v-autocomplete
                        v-model="formData.individualAgreementOperation"
                        :items="agreementOperationOptions"
                        label="Операция (соглашение)"
                        placeholder="Укажите: тип операции (выпадающий список)"
                        :rules="[v => !!v || 'Операция обязательна']"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Тип соглашения -->
                      <v-autocomplete
                        v-model="formData.individualAgreementType"
                        :items="agreementTypeOptions"
                        label="Тип соглашения"
                        placeholder="Укажите: значение из выпадающего списка"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Типовое соглашение -->
                      <v-text-field
                        v-model="formData.individualAgreementTypical"
                        label="Типовое соглашение"
                        placeholder="Укажите: типовое соглашение с условиями по оплате и отгрузке (пример: Опт, отсрочка 30 КД 100% от реал.)"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- График оплаты -->
                      <v-textarea
                        v-model="formData.individualAgreementPaymentSchedule"
                        label="График оплаты"
                        placeholder="Укажите: как оплачивается продукция (отсрочка по дням, предоплата в % от суммы)"
                        :maxlength="150"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Валюта -->
                      <v-autocomplete
                        v-model="formData.individualAgreementCurrency"
                        :items="currencyOptions"
                        label="Валюта"
                        placeholder="Укажите: валюту расчетов"
                        item-title="FULL_NAME"
                        item-value="CURRENCY"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Ценообразование -->
                      <v-textarea
                        v-model="formData.individualAgreementPricing"
                        label="Ценообразование"
                        placeholder="Укажите: применяемый прайс-лист"
                        :maxlength="150"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Дополнительно -->
                      <v-textarea
                        v-model="formData.individualAgreementAdditional"
                        label="Дополнительно"
                        placeholder="Укажите: дополнительную информацию по заявке"
                        :maxlength="150"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
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
                        placeholder="Укажите: формат взаимодействия с контрагентом (выпадающий список)"
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
                        placeholder="Укажите: номер договора согласно подписанной версии"
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
                        placeholder="Укажите: наименование договора с номером и датой (пример: Договор № 23/00 от 29.12.2020г.)"
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
                        placeholder="Укажите: Ответственное подразделение"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Организация -->
                      <v-autocomplete
                        v-model="formData.organization"
                        :items="organizationOptions"
                        label="Организация"
                        placeholder="Укажите: наименование из 1С ERP (ОРТОНИКА ООО)"
                        :rules="[v => !!v || 'Организация обязательна']"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Организация ИНН -->
                      <v-text-field
                        v-model="formData.organizationInn"
                        label="Организация ИНН"
                        placeholder="Введите ИНН организации..."
                        :rules="getInnRules()"
                        maxlength="12"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Счет организации -->
                      <v-text-field
                        v-model="formData.organizationAccount"
                        label="Счет организации"
                        placeholder="Укажите: расчетный счет организации"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Контрагент -->
                      <v-text-field
                        v-model="formData.counterparty"
                        label="Контрагент"
                        placeholder="Укажите: наименование контрагента (пример: Ромашка ООО)"
                        :rules="[v => !!v || 'Контрагент обязателен']"
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
                        :rules="getInnRules()"
                        maxlength="12"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Партнер -->
                      <v-text-field
                        v-model="formData.partner"
                        label="Партнер"
                        placeholder="Укажите: наименование из 1С ERP"
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
                      <!-- Детализация расчётов -->
                      <v-autocomplete
                        v-model="formData.paymentDetails"
                        :items="paymentDetailsOptions"
                        label="Детализация расчётов"
                        placeholder="Укажите: применяемый вид расчетов по договору (выпадающий список)"
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
                        placeholder="Укажите: валюту расчетов"
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
                        placeholder="Укажите: расчеты осуществляются в иностранной валюте"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Сумма договора фиксирована -->
                      <v-checkbox
                        v-model="formData.fixedContractAmount"
                        label="Сумма договора фиксирована"
                        placeholder="Укажите: фиксируется ли договор определенной суммой"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Разрешена работа с дочерними партнерами -->
                      <v-checkbox
                        v-model="formData.allowSubsidiaryPartners"
                        label="Разрешена работа с дочерними партнерами"
                        placeholder="Укажите: возможность проведения взаиморасчетов между партнерами"
                        class="mb-4"
                      ></v-checkbox>

                      <!-- Маркируемая продукция -->
                      <v-autocomplete
                        v-model="formData.labeledProducts"
                        :items="labeledProductsOptions"
                        label="Маркируемая продукция"
                        placeholder="Укажите: продукция выбывает из оборота или нет"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Запрещать отгрузку -->
                      <v-checkbox
                        v-model="formData.prohibitShipment"
                        label="Запрещать отгрузку"
                        placeholder="Укажите: запрещается ли отгрузка при достижении лимита задолженности"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Не отгружать при сумме задолженности -->
                      <v-checkbox
                        v-model="formData.dontShipOnDebt"
                        label="Не отгружать при сумме задолженности"
                        placeholder="Укажите: лимит задолженности для осуществления отгрузки"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Сумма задолженности -->
                      <v-text-field
                        v-model="formData.debtAmount"
                        label="Сумма задолженности"
                        placeholder="Укажите: сумму задолженности, после которой будут прекращены отгрузки"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Ставка НДС -->
                      <v-autocomplete
                        v-model="formData.vatRate"
                        :items="vatRateOptions"
                        label="Ставка НДС"
                        placeholder="Укажите: значение из выпадающего списка"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Группа фин. учета -->
                      <v-autocomplete
                        v-model="formData.financialGroup"
                        :items="financialGroupOptions"
                        label="Группа фин. учета"
                        placeholder="Укажите: применяемый бухгалтерский счет учета"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Статья ДДС -->
                      <v-autocomplete
                        v-model="formData.ddsArticle"
                        :items="ddsArticleOptions"
                        label="Статья ДДС"
                        placeholder="Укажите: используемую статью движения денежных средств для аналитики"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Классификация задолженности -->
                      <v-autocomplete
                        v-model="formData.debtClassification"
                        :items="debtClassificationOptions"
                        label="Классификация задолженности"
                        placeholder="Укажите: значение из выпадающего списка"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Операция декларации по НДС -->
                      <v-autocomplete
                        v-model="formData.vatDeclarationOperation"
                        :items="vatDeclarationOperationOptions"
                        label="Операция декларации по НДС"
                        placeholder="Укажите: значение из выпадающего списка"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Файл -->
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Файлы"
                        placeholder="Прикрепите: скан-копию с корректной информацией, печатями (если применимо)"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                        class="mb-6"
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
                        placeholder="Укажите: в зависимости от формата продаж (выпадающий список)"
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
                        placeholder="Укажите: к какой группе относится (основной, инвентаризация, соисполнители, участки производства и др.)"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Наименование -->
                      <v-text-field
                        v-model="formData.warehouseName"
                        label="Наименование склада"
                        placeholder="Укажите: наименование склада"
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
                        placeholder="Укажите: значение из выпадающего списка"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Учетный вид цены -->
                      <v-text-field
                        v-model="formData.accountingPriceType"
                        label="Учетный вид цены"
                        placeholder="Укажите: применяемый прайс-лист (если применимо)"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Контролировать свободные остатки -->
                      <v-checkbox
                        v-model="formData.controlFreeBalance"
                        label="Контролировать свободные остатки"
                        placeholder="Укажите: проводится ли проверка наличия достаточного количества ТМЦ перед проведением документов"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Контролировать оперативные остатки -->
                      <v-checkbox
                        v-model="formData.controlOperationalBalance"
                        label="Контролировать оперативные остатки"
                        placeholder="Укажите: проводится ли проверка наличия ТМЦ при проведении документов"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Подразделение -->
                      <v-text-field
                        v-model="formData.department"
                        label="Подразделение"
                        placeholder="Укажите: Ответственное подразделение"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Ответственный (МОЛ) -->
                      <v-text-field
                        v-model="formData.responsiblePerson"
                        label="Ответственный (МОЛ)"
                        placeholder="Укажите: материально-ответственное лицо (пример: Иванов Андрей Сергеевич)"
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
                        placeholder="Укажите: регион или область России"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>
                      
                      <!-- Ордерная схема -->
                      <v-checkbox
                        v-model="formData.orderScheme"
                        label="Ордерная схема"
                        placeholder="Укажите: применение приходных и расходных ордеров при движении ТМЦ"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Ячейки -->
                      <v-checkbox
                        v-model="formData.hasCells"
                        label="Ячейки"
                        placeholder="Укажите: применяется ли адресное хранение (ячейки)"
                        class="mb-4"
                      ></v-checkbox>
                      
                      <!-- Адрес -->
                      <v-text-field
                        v-model="formData.warehouseAddress"
                        label="Адрес склада"
                        placeholder="Укажите: адрес в порядке индекс, область, город, улица, дом, квартира/ помещение"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Телефон -->
                      <v-text-field
                        v-model="formData.warehousePhone"
                        label="Телефон склада"
                        placeholder="Укажите: номер в формате +7 (999) 999 99 99"
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
                        placeholder="Укажите: дополнительную информацию"
                        :maxlength="250"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Файл -->
                      <v-file-input
                        v-model="formData.hasFile"
                        label="Файлы"
                        placeholder="Прикрепите: скан-копию с корректной информацией, печатями (если применимо)"
                        multiple
                        chips
                        counter
                        show-size
                        prepend-icon="mdi-paperclip"
                        :rules="fileRules"
                        variant="outlined"
                        class="mb-4"
                      ></v-file-input>
                      
                      <!-- Склад (код) -->
                      <v-text-field
                        v-model="formData.warehouseCode"
                        label="Склад (код)"
                        placeholder="Укажите: код из 1С ERP"
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
                        placeholder="Укажите: наименование из 1С ERP"
                        :rules="[v => !!v || 'Номенклатура обязательна']"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Номенклатура код -->
                      <v-text-field
                        v-model="formData.nomenclatureCodes"
                        label="Номенклатура (код)"
                        placeholder="Укажите: код из 1С ERP"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Дополнительно -->
                      <v-text-field
                        v-model="formData.additionalInfo"
                        label="Дополнительно"
                        placeholder="Укажите: дополнительную информацию по заявке"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Единица измерения -->
                      <v-text-field
                        v-model="formData.measurementUnit"
                        label="Единица измерения"
                        placeholder="Укажите: единицу измерения товара/ продукции"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- 1 шт упаковки состоит из -->
                      <v-text-field
                        v-model="formData.packageComposition"
                        label="1 шт упаковки состоит из"
                        placeholder="Укажите: состав 1 упаковки"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Вес -->
                      <v-text-field
                        v-model="formData.weight"
                        label="Вес"
                        placeholder="Укажите: вес в кг"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Высота, м -->
                      <v-text-field
                        v-model="formData.height"
                        label="Высота, м"
                        placeholder="Укажите: значение в метрах"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Ширина, м -->
                      <v-text-field
                        v-model="formData.width"
                        label="Ширина, м"
                        placeholder="Укажите: значение в метрах"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Глубина, м -->
                      <v-text-field
                        v-model="formData.depth"
                        label="Глубина, м"
                        placeholder="Укажите: значение в метрах"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Объем -->
                      <v-text-field
                        v-model="formData.volume"
                        label="Объем"
                        placeholder="Рассчитывается по формуле"
                        type="number"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Упаковка -->
                      <v-text-field
                        v-model="formData.packageName"
                        label="Упаковка"
                        placeholder="Укажите: наименование упаковки"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-6"
                      ></v-text-field>
                    </div>
                  </div>
                  
                  <!-- Поля для объекта "Скидки (наценки)" -->
                  <div v-else-if="formData.object === '16959'">
                    <!-- Шаг 2: Данные скидки -->
                    <div v-if="stepData.stepNumber === 2">
                      <h3 class="text-h6 mb-4">Данные скидки</h3>
                      <!-- Основание -->
                      <v-text-field
                        v-model="formData.discountBasis"
                        label="Основание"
                        placeholder="Укажите: основание для отражения в системе (Укажите № приказа)"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      <v-row class="file">
                        <!-- Основание (файл) -->
                        <v-file-input
                          v-model="formData.discountBasisFile"
                          label="Файлы"
                          placeholder="Прикрепите: файл-основание"
                          multiple
                          chips
                          counter
                          show-size
                          prepend-icon="mdi-paperclip"
                          variant="outlined"
                          class="mb-4"
                        ></v-file-input>
                        <div class="mb-4">
                          <v-btn
                            color="secondary"
                            variant="outlined"
                            size="small"
                            href="assets/discount_template.xlsx"
                            target="_blank"
                            prepend-icon="mdi-download"
                          >
                            Скачать образец файла
                          </v-btn>
                        </div>
                      </v-row>
                      <!-- Наименование -->
                      <v-text-field
                        v-model="formData.discountName"
                        label="Наименование"
                        placeholder="Укажите: наименование скидки"
                        :rules="[v => !!v || 'Наименование обязательно']"
                        :maxlength="150"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Тип скидки -->
                      <v-autocomplete
                        v-model="formData.discountType"
                        :items="discountTypeOptions"
                        label="Тип скидки"
                        placeholder="Укажите: значение из выпадающего списка"
                        :rules="[v => !!v || 'Тип скидки обязателен']"
                        item-title="title"
                        item-value="id"
                        variant="outlined"
                        required
                        class="mb-4"
                      ></v-autocomplete>

                      <!-- Канал продаж -->
                      <v-autocomplete
                        v-model="formData.salesChannel"
                        :items="salesChannelOptions"
                        label="Канал продаж"
                        placeholder="Укажите: значение из выпадающего списка"
                        variant="outlined"
                        class="mb-4"
                      ></v-autocomplete>

                      <!-- Период действия с -->
                      <v-text-field
                        v-model="formData.discountPeriodFrom"
                        label="Период действия с"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия по -->
                      <v-text-field
                        v-model="formData.discountPeriodTo"
                        label="Период действия по"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      <!-- Отборы (соглашения) -->
                      <v-textarea
                        v-model="formData.discountSelections"
                        label="Отборы (соглашения)"
                        placeholder="Укажите: применяемые отборы для скидки по соглашениям"
                        :maxlength="500"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      <!-- Механика и условия предоставления -->
                      <v-textarea
                        v-model="formData.discountMechanics"
                        label="Механика и условия предоставления"
                        placeholder="Укажите: механизм применения скидки (пример: при покупке от 2-х шт. Pulse 450 (UT-00021451) скидка 5%)"
                        :rules="[v => !!v || 'Механика скидки обязательна']"
                        :maxlength="500"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      <!-- Дополнительно -->
                      <v-textarea
                        v-model="formData.discountAdditional"
                        label="Дополнительно"
                        placeholder="Укажите: дополнительную информацию по заявке"
                        :maxlength="500"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                    </div>
                  </div>

                  <!-- Поля для объекта "Цены (прайс-лист)" -->
                  <div v-else-if="formData.object === '16961'">
                    <!-- Шаг 2: Данные цены -->
                    <div v-if="stepData.stepNumber === 2">
                      <h3 class="text-h6 mb-4">Данные цены</h3>
                      <!-- Основание -->
                      <v-text-field
                        v-model="formData.priceBasis"
                        label="Основание"
                        placeholder="Укажите: основание для отражения в системе (Укажите № приказа)"
                        :maxlength="250"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      <v-row class="file">
                        <!-- Основание (файл) -->
                        <v-file-input
                          v-model="formData.priceBasisFile"
                          label="Файлы"
                          placeholder="Прикрепите: файлы в формате excel по шаблону"
                          multiple
                          chips
                          counter
                          show-size
                          prepend-icon="mdi-paperclip"
                          variant="outlined"
                          class="mb-4"
                        ></v-file-input>
                        <div class="mb-4">
                          <v-btn
                            color="secondary"
                            variant="outlined"
                            size="small"
                            href="assets/price_template.xlsx"
                            target="_blank"
                            prepend-icon="mdi-download"
                          >
                            Скачать образец файла
                          </v-btn>
                        </div>
                      </v-row>
                      <!-- Причина изменения -->
                      <v-textarea
                        v-model="formData.priceChangeReason"
                        label="Причина изменения"
                        placeholder="Укажите: причину распродажи, проведения акции и др."
                        :rules="[v => !!v || 'Причина изменения обязательна']"
                        :maxlength="500"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                      
                      <!-- Период действия с -->
                      <v-text-field
                        v-model="formData.pricePeriodFrom"
                        label="Период действия с"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Период действия по -->
                      <v-text-field
                        v-model="formData.pricePeriodTo"
                        label="Период действия по"
                        type="date"
                        variant="outlined"
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Подразделение -->
                      <v-text-field
                        v-model="formData.priceDepartment"
                        label="Подразделение"
                        placeholder="Укажите: Ответственное подразделение"
                        :maxlength="50"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-text-field>
                      
                      <!-- Дополнительно -->
                      <v-textarea
                        v-model="formData.priceAdditional"
                        label="Дополнительно"
                        placeholder="Укажите: дополнительную информацию по заявке"
                        :maxlength="500"
                        rows="3"
                        variant="outlined"
                        counter
                        class="mb-4"
                      ></v-textarea>
                    </div>
                  </div>
<!-- Поля для объекта "Контрагент/ Договор" (17961) -->
<div v-else-if="formData.object === '17961'">
  <!-- Шаг 2: Данные контрагента -->
  <div v-if="stepData.stepNumber === 2">
    <h3 class="text-h6 mb-4">Данные контрагента</h3>
    
    <!-- Вид контрагента -->
    <v-autocomplete
      v-model="formData.complexCounterpartyType"
      :items="counterpartyTypeOptions"
      label="Вид контрагента"
      placeholder="Выберите вид контрагента"
      :rules="[v => !!v || 'Вид контрагента обязателен']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
      @update:model-value="resetCounterpartySpecificFields"
    ></v-autocomplete>
    
    <!-- ИНН -->
    <v-text-field
      v-model="formData.complexInn"
      label="ИНН"
      placeholder="Введите ИНН"
      :rules="getInnRules()"
      maxlength="12"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Наименование -->
    <v-text-field
      v-model="formData.complexName"
      label="Наименование"
      placeholder="Укажите полное наименование контрагента"
      :rules="[v => !!v || 'Наименование обязательно']"
      :maxlength="100"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Сокр. наименование -->
    <v-text-field
      v-model="formData.complexShortName"
      label="Сокр. наименование"
      placeholder="Укажите сокращенное наименование"
      :rules="[v => !!v || 'Сокращенное наименование обязательно']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Конкретные поля для ЮЛ и ОПЮЛ -->
    <div v-if="['17941', '17943'].includes(formData.complexCounterpartyType)">
      <!-- КПП -->
      <v-text-field
        v-model="formData.complexKpp"
        label="КПП"
        placeholder="Введите КПП"
        :rules="kppRules"
        :maxlength="9"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОГРН -->
      <v-text-field
        v-model="formData.complexOgrn"
        label="ОГРН"
        placeholder="Введите ОГРН"
        :rules="ogrnRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОКПО -->
      <v-text-field
        v-model="formData.complexOkpo"
        label="ОКПО"
        placeholder="Введите ОКПО"
        :rules="okpoRules"
        :maxlength="10"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ОПЮЛ -->
    <div v-if="formData.complexCounterpartyType === '17943'">
      <!-- ИНН Головного контрагента -->
      <v-text-field
        v-model="formData.complexHeadInn"
        label="ИНН Головного контрагента"
        placeholder="Введите ИНН головного контрагента"
        :rules="[v => !!v || 'ИНН головного контрагента обязателен']"
        maxlength="12"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Головной контрагент -->
      <v-text-field
        v-model="formData.complexHeadCounterparty"
        label="Головной контрагент"
        placeholder="Укажите головного контрагента"
        :rules="[v => !!v || 'Головной контрагент обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ФЛ -->
    <div v-if="formData.complexCounterpartyType === '17945'">
      <v-text-field
        v-model="formData.complexIdentityDocument"
        label="Документ удост. личность"
        placeholder="Укажите реквизиты документа, удостоверяющего личность"
        :rules="[v => !!v || 'Документ обязателен']"
        :maxlength="150"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ИП -->
    <div v-if="formData.complexCounterpartyType === '17947'">
      <v-text-field
        v-model="formData.complexOgrnip"
        label="ОГРНИП"
        placeholder="Введите ОГРНИП"
        :rules="ogrnipRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ЮЛН -->
    <div v-if="formData.complexCounterpartyType === '17949'">
      <!-- Страна регистрации -->
      <v-autocomplete
        v-model="formData.complexRegistrationCountry"
        :items="registrationCountryOptions"
        item-title="NAME"
        item-value="NAME"
        label="Страна регистрации"
        placeholder="Выберите страну регистрации"
        :rules="[v => !!v || 'Страна регистрации обязательна']"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Рег. номер -->
      <v-text-field
        v-model="formData.complexRegistrationNumber"
        label="Рег. номер"
        placeholder="Укажите регистрационный номер в стране регистрации"
        :rules="[v => !!v || 'Регистрационный номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Налоговый номер -->
      <v-text-field
        v-model="formData.complexTaxNumber"
        label="Налоговый номер"
        placeholder="Укажите налоговый номер страны регистрации"
        :rules="[v => !!v || 'Налоговый номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Юридический адрес -->
    <v-text-field
      v-model="formData.complexLegalAddress"
      label="Юридический адрес"
      placeholder="Укажите юридический адрес"
      :rules="[v => !!v || 'Юридический адрес обязателен']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Фактический адрес -->
    <v-text-field
      v-model="formData.complexActualAddress"
      label="Фактический адрес"
      placeholder="Укажите фактический адрес (если отличается от юридического)"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Телефон -->
    <v-text-field
      v-model="formData.complexPhone"
      label="Телефон"
      v-mask="'+7 (###) ###-##-##'"
      placeholder="Укажите номер в формате +7 (999) 999 99 99"
      :rules="phoneRules"
      :maxlength="20"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Электронная почта -->
    <v-text-field
      v-model="formData.complexEmail"
      label="Электронная почта"
      placeholder="Укажите email в формате name@domain.com"
      :rules="emailRules"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Контактное лицо -->
    <v-text-field
      v-model="formData.complexContactPerson"
      label="Контактное лицо"
      placeholder="Укажите ФИО контактного лица"
      :rules="[v => !!v || 'Контактное лицо обязательно']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
  </div>
  
  <!-- Шаг 3: Данные договора -->
  <div v-if="stepData.stepNumber === 3">
    <h3 class="text-h6 mb-4">Данные договора</h3>
    
    <!-- Цель договора -->
    <v-autocomplete
      v-model="formData.complexContractPurpose"
      :items="contractPurposeOptions"
      label="Цель договора"
      placeholder="Укажите формат взаимодействия с контрагентом"
      :rules="[v => !!v || 'Цель договора обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Номер договора -->
    <v-text-field
      v-model="formData.complexContractNumber"
      label="Номер договора"
      placeholder="Укажите номер договора"
      :rules="[v => !!v || 'Номер договора обязателен']"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Дата договора -->
    <v-text-field
      v-model="formData.complexContractDate"
      label="Дата договора"
      type="date"
      variant="outlined"
      required
      class="mb-4"
    ></v-text-field>
    
    <!-- Период действия с -->
    <v-text-field
      v-model="formData.complexContractPeriodFrom"
      label="Период действия с"
      type="date"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Период действия по -->
    <v-text-field
      v-model="formData.complexContractPeriodTo"
      label="Период действия по"
      type="date"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Наименование договора -->
    <v-text-field
      v-model="formData.complexContractName"
      label="Наименование договора"
      placeholder="Укажите наименование договора"
      :rules="[v => !!v || 'Наименование договора обязательно']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Подразделение -->
    <v-text-field
      v-model="formData.complexDepartment"
      label="Подразделение"
      placeholder="Укажите подразделение инициатора"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Организация -->
    <v-autocomplete
      v-model="formData.complexOrganization"
      :items="organizationOptions"
      label="Организация"
      placeholder="Укажите наименование из 1С ERP"
      :rules="[v => !!v || 'Организация обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Организация ИНН -->
    <v-text-field
      v-model="formData.complexOrganizationInn"
      label="Организация ИНН"
      placeholder="Введите ИНН организации..."
      :rules="getInnRules()"
      maxlength="12"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Счет организации -->
    <v-text-field
      v-model="formData.complexOrganizationAccount"
      label="Счет организации"
      placeholder="Укажите расчетный счет организации"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Партнер -->
    <v-text-field
      v-model="formData.complexPartner"
      label="Партнер"
      placeholder="Укажите наименование из 1С ERP"
      :rules="[v => !!v || 'Партнер обязателен']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Детализация расчётов -->
    <v-autocomplete
      v-model="formData.complexPaymentDetails"
      :items="paymentDetailsOptions"
      label="Детализация расчётов"
      placeholder="Укажите применяемый вид расчетов по договору"
      :rules="[v => !!v || 'Детализация расчётов обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Валюта -->
    <v-autocomplete
      v-model="formData.complexCurrency"
      :items="currencyOptions"
      label="Валюта"
      placeholder="Укажите валюту расчетов"
      :rules="[v => !!v || 'Валюта обязательна']"
      item-title="FULL_NAME"
      item-value="CURRENCY"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Оплата в иностранной валюте -->
    <v-checkbox
      v-model="formData.complexForeignCurrencyPayment"
      label="Оплата в иностранной валюте"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Сумма договора фиксирована -->
    <v-checkbox
      v-model="formData.complexFixedContractAmount"
      label="Сумма договора фиксирована"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Разрешена работа с дочерними партнерами -->
    <v-checkbox
      v-model="formData.complexAllowSubsidiaryPartners"
      label="Разрешена работа с дочерними партнерами"
      class="mb-4"
    ></v-checkbox>

    <!-- Маркируемая продукция -->
    <v-autocomplete
      v-model="formData.complexLabeledProducts"
      :items="labeledProductsOptions"
      label="Маркируемая продукция"
      placeholder="Укажите продукция выбывает из оборота или нет"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Запрещать отгрузку -->
    <v-checkbox
      v-model="formData.complexProhibitShipment"
      label="Запрещать отгрузку"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Не отгружать при сумме задолженности -->
    <v-checkbox
      v-model="formData.complexDontShipOnDebt"
      label="Не отгружать при сумме задолженности"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Сумма задолженности -->
    <v-text-field
      v-model="formData.complexDebtAmount"
      label="Сумма задолженности"
      placeholder="Укажите сумму задолженности"
      type="number"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Ставка НДС -->
    <v-autocomplete
      v-model="formData.complexVatRate"
      :items="vatRateOptions"
      label="Ставка НДС"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Группа фин. учета -->
    <v-autocomplete
      v-model="formData.complexFinancialGroup"
      :items="financialGroupOptions"
      label="Группа фин. учета"
      placeholder="Укажите применяемый бухгалтерский счет учета"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Статья ДДС -->
    <v-autocomplete
      v-model="formData.complexDdsArticle"
      :items="ddsArticleOptions"
      label="Статья ДДС"
      placeholder="Укажите используемую статью движения денежных средств"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Классификация задолженности -->
    <v-autocomplete
      v-model="formData.complexDebtClassification"
      :items="debtClassificationOptions"
      label="Классификация задолженности"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Операция декларации по НДС -->
    <v-autocomplete
      v-model="formData.complexVatDeclarationOperation"
      :items="vatDeclarationOperationOptions"
      label="Операция декларации по НДС"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Файлы -->
    <v-file-input
      v-model="formData.complexHasFile"
      label="Файлы"
      placeholder="Прикрепите необходимые документы"
      multiple
      chips
      counter
      show-size
      prepend-icon="mdi-paperclip"
      :rules="fileRules"
      variant="outlined"
      class="mb-6"
    ></v-file-input>
  </div>
</div>

<!-- Поля для объекта "Партнер/ Контрагент/ Договор" (17959) -->
<div v-else-if="formData.object === '17959'">
  <!-- Шаг 2: Данные партнера -->
  <div v-if="stepData.stepNumber === 2">
    <h3 class="text-h6 mb-4">Данные партнера</h3>
    
    <!-- Вид партнера -->
    <v-autocomplete
      v-model="formData.combinedPartnerType"
      :items="partnerTypeOptions"
      label="Вид партнера"
      placeholder="Выберите вид партнера"
      :rules="[v => !!v || 'Вид партнера обязателен']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Поля для КП (компания) -->
    <div v-if="formData.combinedPartnerType === '16961'">
      <v-text-field
        v-model="formData.combinedPartnerName"
        label="Наименование"
        placeholder="Укажите наименование партнера"
        :rules="[v => !!v || 'Наименование обязательно']"
        :maxlength="250"
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
      <!-- Телефон (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedPhone"
            label="Телефон"
            v-mask="'+7 (###) ###-##-##'"
            placeholder="Укажите номер в формате +7 (999) 999 99 99"
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
            @click="addCombinedPhoneField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные телефоны -->
        <div v-for="(phone, index) in formData.combinedAdditionalPhones" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedAdditionalPhones[index]"
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
            @click="removeCombinedPhoneField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Email (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedEmail"
            label="Электронная почта"
            placeholder="Укажите электронную почту"
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
            @click="addCombinedEmailField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные email -->
        <div v-for="(email, index) in formData.combinedAdditionalEmails" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedAdditionalEmails[index]"
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
            @click="removeCombinedEmailField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Бизнес-регион (множественный выбор) -->
      <v-autocomplete
        v-model="formData.combinedBusinessRegion"
        :items="businessRegionOptions"
        label="Бизнес-регион"
        placeholder="Укажите регион или область России"
        :rules="[v => !!v && v.length > 0 || 'Выберите хотя бы один бизнес-регион']"
        variant="outlined"
        multiple
        chips
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Тип отношений (множественный выбор) -->
      <v-autocomplete
        v-model="formData.combinedRelationshipType"
        :items="relationshipTypeOptions"
        label="Тип отношений"
        placeholder="Укажите тип взаимоотношений с партнером"
        variant="outlined"
        multiple
        chips
        class="mb-4"
      ></v-autocomplete>
      
      <v-text-field
        v-model="formData.combinedLegalAddress"
        label="Юридический адрес"
        placeholder="Укажите юридический адрес"
        :rules="[v => !!v || 'Юридический адрес обязателен']"
        :maxlength="250"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <v-text-field
        v-model="formData.combinedActualAddress"
        label="Фактический адрес"
        placeholder="Укажите фактический адрес"
        :maxlength="250"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <v-checkbox
        v-model="formData.combinedCopyAddress"
        label="Скопировать юридический адрес в фактический"
        class="mb-4"
        @update:model-value="handleCombinedCopyAddress"
      ></v-checkbox>
      
      <!-- Категория B2 -->
      <v-autocomplete
        v-model="formData.combinedCategoryB2"
        :items="categoryB2Options"
        label="Категория B2"
        placeholder="Укажите дополнительную аналитику по категории"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Категория СА -->
      <v-autocomplete
        v-model="formData.combinedCategoryCA"
        :items="categoryCAOptions"
        label="Категория СА"
        placeholder="Укажите дополнительную аналитику по категории"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- ЦКГ -->
      <v-autocomplete
        v-model="formData.combinedCkg"
        :items="ckgOptions"
        label="ЦКГ"
        placeholder="Укажите целевую клиентскую группу"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- ЦКГ B2B -->
      <v-autocomplete
        v-model="formData.combinedCkgB2B"
        :items="ckgB2BOptions"
        label="ЦКГ B2B"
        placeholder="Укажите аналитику по целевым клиентским группам для B2B"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
    </div>
    
    <!-- Поля для ЧЛ (частное лицо) -->
    <div v-else-if="formData.combinedPartnerType === '16963'">
      <v-text-field
        v-model="formData.combinedPartnerName"
        label="Наименование"
        placeholder="Укажите наименование"
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
            v-model="formData.combinedPhone"
            label="Телефон"
            v-mask="'+7 (###) ###-##-##'"
            placeholder="Укажите номер в формате +7 (999) 999 99 99"
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
            @click="addCombinedPhoneField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные телефоны -->
        <div v-for="(phone, index) in formData.combinedAdditionalPhones" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedAdditionalPhones[index]"
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
            @click="removeCombinedPhoneField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Email (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedEmail"
            label="Электронная почта"
            placeholder="Укажите электронную почту"
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
            @click="addCombinedEmailField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные email -->
        <div v-for="(email, index) in formData.combinedAdditionalEmails" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.combinedAdditionalEmails[index]"
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
            @click="removeCombinedEmailField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Шаг 3: Данные контрагента -->
  <div v-if="stepData.stepNumber === 3">
    <h3 class="text-h6 mb-4">Данные контрагента</h3>
    
    <!-- Вид контрагента -->
    <v-autocomplete
      v-model="formData.combinedCounterpartyType"
      :items="counterpartyTypeOptions"
      label="Вид контрагента"
      placeholder="Выберите вид контрагента"
      :rules="[v => !!v || 'Вид контрагента обязателен']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
      @update:model-value="resetCombinedCounterpartySpecificFields"
    ></v-autocomplete>
    
    <!-- ИНН -->
    <v-text-field
      v-model="formData.combinedInn"
      label="ИНН"
      placeholder="Введите ИНН"
      maxlength="12"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Наименование -->
    <v-text-field
      v-model="formData.combinedCounterpartyName"
      label="Наименование"
      placeholder="Укажите полное наименование контрагента"
      :rules="[v => !!v || 'Наименование обязательно']"
      :maxlength="100"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Сокр. наименование -->
    <v-text-field
      v-model="formData.combinedShortName"
      label="Сокр. наименование"
      placeholder="Укажите сокращенное наименование"
      :rules="[v => !!v || 'Сокращенное наименование обязательно']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Конкретные поля для ЮЛ и ОПЮЛ -->
    <div v-if="['17941', '17943'].includes(formData.combinedCounterpartyType)">
      <!-- КПП -->
      <v-text-field
        v-model="formData.combinedKpp"
        label="КПП"
        placeholder="Введите КПП"
        :rules="kppRules"
        :maxlength="9"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОГРН -->
      <v-text-field
        v-model="formData.combinedOgrn"
        label="ОГРН"
        placeholder="Введите ОГРН"
        :rules="ogrnRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОКПО -->
      <v-text-field
        v-model="formData.combinedOkpo"
        label="ОКПО"
        placeholder="Введите ОКПО"
        :rules="okpoRules"
        :maxlength="10"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ОПЮЛ -->
    <div v-if="formData.combinedCounterpartyType === '17943'">
      <!-- ИНН Головного контрагента -->
      <v-text-field
        v-model="formData.combinedHeadInn"
        label="ИНН Головного контрагента"
        placeholder="Введите ИНН головного контрагента"
        :rules="[v => !!v || 'ИНН головного контрагента обязателен']"
        :maxlength="12"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Головной контрагент -->
      <v-text-field
        v-model="formData.combinedHeadCounterparty"
        label="Головной контрагент"
        placeholder="Укажите головного контрагента"
        :rules="[v => !!v || 'Головной контрагент обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ФЛ -->
    <div v-if="formData.combinedCounterpartyType === '17945'">
      <v-text-field
        v-model="formData.combinedIdentityDocument"
        label="Документ удост. личность"
        placeholder="Укажите реквизиты документа, удостоверяющего личность"
        :rules="[v => !!v || 'Документ обязателен']"
        :maxlength="150"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ИП -->
    <div v-if="formData.combinedCounterpartyType === '17947'">
      <v-text-field
        v-model="formData.combinedOgrnip"
        label="ОГРНИП"
        placeholder="Введите ОГРНИП"
        :rules="ogrnipRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ЮЛН -->
    <div v-if="formData.combinedCounterpartyType === '17949'">
      <!-- Страна регистрации -->
      <v-autocomplete
        v-model="formData.combinedRegistrationCountry"
        :items="registrationCountryOptions"
        item-title="NAME"
        item-value="NAME"
        label="Страна регистрации"
        placeholder="Выберите страну регистрации"
        :rules="[v => !!v || 'Страна регистрации обязательна']"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Рег. номер -->
      <v-text-field
        v-model="formData.combinedRegistrationNumber"
        label="Рег. номер"
        placeholder="Укажите регистрационный номер в стране регистрации"
        :rules="[v => !!v || 'Регистрационный номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Налоговый номер -->
      <v-text-field
        v-model="formData.combinedTaxNumber"
        label="Налоговый номер"
        placeholder="Укажите налоговый номер страны регистрации"
        :rules="[v => !!v || 'Налоговый номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Юридический адрес -->
    <v-text-field
      v-model="formData.combinedCounterpartyLegalAddress"
      label="Юридический адрес"
      placeholder="Укажите юридический адрес"
      :rules="[v => !!v || 'Юридический адрес обязателен']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Фактический адрес -->
    <v-text-field
      v-model="formData.combinedCounterpartyActualAddress"
      label="Фактический адрес"
      placeholder="Укажите фактический адрес"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Телефон -->
    <v-text-field
      v-model="formData.combinedCounterpartyPhone"
      label="Телефон"
      v-mask="'+7 (###) ###-##-##'"
      placeholder="Укажите номер в формате +7 (999) 999 99 99"
      :rules="phoneRules"
      :maxlength="20"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Электронная почта -->
    <v-text-field
      v-model="formData.combinedCounterpartyEmail"
      label="Электронная почта"
      placeholder="Укажите email в формате name@domain.com"
      :rules="emailRules"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Контактное лицо -->
    <v-text-field
      v-model="formData.combinedContactPerson"
      label="Контактное лицо"
      placeholder="Укажите ФИО контактного лица"
      :rules="[v => !!v || 'Контактное лицо обязательно']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
  </div>
  
  <!-- Шаг 4: Данные договора -->
  <div v-if="stepData.stepNumber === 4">
    <h3 class="text-h6 mb-4">Данные договора</h3>
    
    <!-- Цель договора -->
    <v-autocomplete
      v-model="formData.combinedContractPurpose"
      :items="contractPurposeOptions"
      label="Цель договора"
      placeholder="Укажите формат взаимодействия с контрагентом"
      :rules="[v => !!v || 'Цель договора обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Номер договора -->
    <v-text-field
      v-model="formData.combinedContractNumber"
      label="Номер договора"
      placeholder="Укажите номер договора"
      :rules="[v => !!v || 'Номер договора обязателен']"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Дата договора -->
    <v-text-field
      v-model="formData.combinedContractDate"
      label="Дата договора"
      type="date"
      variant="outlined"
      required
      class="mb-4"
    ></v-text-field>
    
    <!-- Период действия с -->
    <v-text-field
      v-model="formData.combinedContractPeriodFrom"
      label="Период действия с"
      type="date"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Период действия по -->
    <v-text-field
      v-model="formData.combinedContractPeriodTo"
      label="Период действия по"
      type="date"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Наименование договора -->
    <v-text-field
      v-model="formData.combinedContractName"
      label="Наименование договора"
      placeholder="Укажите наименование договора"
      :rules="[v => !!v || 'Наименование договора обязательно']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Подразделение -->
    <v-text-field
      v-model="formData.combinedDepartment"
      label="Подразделение"
      placeholder="Укажите подразделение инициатора"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Организация -->
    <v-autocomplete
      v-model="formData.combinedOrganization"
      :items="organizationOptions"
      label="Организация"
      placeholder="Укажите наименование из 1С ERP"
      :rules="[v => !!v || 'Организация обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Организация ИНН -->
    <v-text-field
      v-model="formData.combinedOrganizationInn"
      label="Организация ИНН"
      placeholder="Введите ИНН организации..."
      :rules="getInnRules()"
      maxlength="12"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Счет организации -->
    <v-text-field
      v-model="formData.combinedOrganizationAccount"
      label="Счет организации"
      placeholder="Укажите расчетный счет организации"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Детализация расчётов -->
    <v-autocomplete
      v-model="formData.combinedPaymentDetails"
      :items="paymentDetailsOptions"
      label="Детализация расчётов"
      placeholder="Укажите применяемый вид расчетов по договору"
      :rules="[v => !!v || 'Детализация расчётов обязательна']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Валюта -->
    <v-autocomplete
      v-model="formData.combinedCurrency"
      :items="currencyOptions"
      label="Валюта"
      placeholder="Укажите валюту расчетов"
      :rules="[v => !!v || 'Валюта обязательна']"
      item-title="FULL_NAME"
      item-value="CURRENCY"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Оплата в иностранной валюте -->
    <v-checkbox
      v-model="formData.combinedForeignCurrencyPayment"
      label="Оплата в иностранной валюте"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Сумма договора фиксирована -->
    <v-checkbox
      v-model="formData.combinedFixedContractAmount"
      label="Сумма договора фиксирована"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Разрешена работа с дочерними партнерами -->
    <v-checkbox
      v-model="formData.combinedAllowSubsidiaryPartners"
      label="Разрешена работа с дочерними партнерами"
      class="mb-4"
    ></v-checkbox>

    <!-- Маркируемая продукция -->
    <v-autocomplete
      v-model="formData.combinedLabeledProducts"
      :items="labeledProductsOptions"
      label="Маркируемая продукция"
      placeholder="Укажите продукция выбывает из оборота или нет"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Запрещать отгрузку -->
    <v-checkbox
      v-model="formData.combinedProhibitShipment"
      label="Запрещать отгрузку"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Не отгружать при сумме задолженности -->
    <v-checkbox
      v-model="formData.combinedDontShipOnDebt"
      label="Не отгружать при сумме задолженности"
      class="mb-4"
    ></v-checkbox>
    
    <!-- Сумма задолженности -->
    <v-text-field
      v-model="formData.combinedDebtAmount"
      label="Сумма задолженности"
      placeholder="Укажите сумму задолженности"
      type="number"
      variant="outlined"
      class="mb-4"
    ></v-text-field>
    
    <!-- Ставка НДС -->
    <v-autocomplete
      v-model="formData.combinedVatRate"
      :items="vatRateOptions"
      label="Ставка НДС"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Группа фин. учета -->
    <v-autocomplete
      v-model="formData.combinedFinancialGroup"
      :items="financialGroupOptions"
      label="Группа фин. учета"
      placeholder="Укажите применяемый бухгалтерский счет учета"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Статья ДДС -->
    <v-autocomplete
      v-model="formData.combinedDdsArticle"
      :items="ddsArticleOptions"
      label="Статья ДДС"
      placeholder="Укажите используемую статью движения денежных средств"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Классификация задолженности -->
    <v-autocomplete
      v-model="formData.combinedDebtClassification"
      :items="debtClassificationOptions"
      label="Классификация задолженности"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Операция декларации по НДС -->
    <v-autocomplete
      v-model="formData.combinedVatDeclarationOperation"
      :items="vatDeclarationOperationOptions"
      label="Операция декларации по НДС"
      placeholder="Укажите значение из выпадающего списка"
      variant="outlined"
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Файлы -->
    <v-file-input
      v-model="formData.combinedHasFile"
      label="Файлы"
      placeholder="Прикрепите необходимые документы"
      multiple
      chips
      counter
      show-size
      prepend-icon="mdi-paperclip"
      :rules="fileRules"
      variant="outlined"
      class="mb-6"
    ></v-file-input>
  </div>
</div>

<!-- Поля для объекта "Партнёр/ Контрагент" (18003) -->
<div v-else-if="formData.object === '18003'">
  <!-- Шаг 2: Данные партнера -->
  <div v-if="stepData.stepNumber === 2">
    <h3 class="text-h6 mb-4">Данные партнера</h3>
    
    <!-- Вид партнера -->
    <v-autocomplete
      v-model="formData.partnerCounterpartyPartnerType"
      :items="partnerTypeOptions"
      label="Вид партнера"
      placeholder="Выберите вид партнера"
      :rules="[v => !!v || 'Вид партнера обязателен']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
    ></v-autocomplete>
    
    <!-- Поля для КП (компания) -->
    <div v-if="formData.partnerCounterpartyPartnerType === '16961'">
      <v-text-field
        v-model="formData.partnerCounterpartyName"
        label="Наименование"
        placeholder="Укажите наименование партнера"
        :rules="[v => !!v || 'Наименование обязательно']"
        :maxlength="250"
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
      <!-- Телефон (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyPhone"
            label="Телефон"
            v-mask="'+7 (###) ###-##-##'"
            placeholder="Укажите номер в формате +7 (999) 999 99 99"
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
            @click="addPartnerCounterpartyPhoneField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные телефоны -->
        <div v-for="(phone, index) in formData.partnerCounterpartyAdditionalPhones" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyAdditionalPhones[index]"
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
            @click="removePartnerCounterpartyPhoneField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Email (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyEmail"
            label="Электронная почта"
            placeholder="Укажите электронную почту"
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
            @click="addPartnerCounterpartyEmailField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные email -->
        <div v-for="(email, index) in formData.partnerCounterpartyAdditionalEmails" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyAdditionalEmails[index]"
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
            @click="removePartnerCounterpartyEmailField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Бизнес-регион (множественный выбор) -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyBusinessRegion"
        :items="businessRegionOptions"
        label="Бизнес-регион"
        placeholder="Укажите регион или область России"
        :rules="[v => !!v && v.length > 0 || 'Выберите хотя бы один бизнес-регион']"
        variant="outlined"
        multiple
        chips
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Тип отношений (множественный выбор) -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyRelationshipType"
        :items="relationshipTypeOptions"
        label="Тип отношений"
        placeholder="Укажите тип взаимоотношений с партнером"
        variant="outlined"
        multiple
        chips
        class="mb-4"
      ></v-autocomplete>
      
      <v-text-field
        v-model="formData.partnerCounterpartyLegalAddress"
        label="Юридический адрес"
        placeholder="Укажите юридический адрес"
        :rules="[v => !!v || 'Юридический адрес обязателен']"
        :maxlength="250"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <v-text-field
        v-model="formData.partnerCounterpartyActualAddress"
        label="Фактический адрес"
        placeholder="Укажите фактический адрес"
        :maxlength="250"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <v-checkbox
        v-model="formData.partnerCounterpartyCopyAddress"
        label="Скопировать юридический адрес в фактический"
        class="mb-4"
        @update:model-value="handlePartnerCounterpartyCopyAddress"
      ></v-checkbox>
      
      <!-- Категория B2 -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyCategoryB2"
        :items="categoryB2Options"
        label="Категория B2"
        placeholder="Укажите дополнительную аналитику по категории"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Категория СА -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyCategoryCA"
        :items="categoryCAOptions"
        label="Категория СА"
        placeholder="Укажите дополнительную аналитику по категории"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- ЦКГ -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyCkg"
        :items="ckgOptions"
        label="ЦКГ"
        placeholder="Укажите целевую клиентскую группу"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- ЦКГ B2B -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyCkgB2B"
        :items="ckgB2BOptions"
        label="ЦКГ B2B"
        placeholder="Укажите аналитику по целевым клиентским группам для B2B"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
    </div>
    
    <!-- Поля для ЧЛ (частное лицо) -->
    <div v-else-if="formData.partnerCounterpartyPartnerType === '16963'">
      <v-text-field
        v-model="formData.partnerCounterpartyName"
        label="Наименование"
        placeholder="Укажите наименование"
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
            v-model="formData.partnerCounterpartyPhone"
            label="Телефон"
            v-mask="'+7 (###) ###-##-##'"
            placeholder="Укажите номер в формате +7 (999) 999 99 99"
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
            @click="addPartnerCounterpartyPhoneField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные телефоны -->
        <div v-for="(phone, index) in formData.partnerCounterpartyAdditionalPhones" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyAdditionalPhones[index]"
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
            @click="removePartnerCounterpartyPhoneField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
      
      <!-- Email (множественное) -->
      <div class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyEmail"
            label="Электронная почта"
            placeholder="Укажите электронную почту"
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
            @click="addPartnerCounterpartyEmailField"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>
        
        <!-- Дополнительные email -->
        <div v-for="(email, index) in formData.partnerCounterpartyAdditionalEmails" :key="index" class="d-flex align-center mb-2">
          <v-text-field
            v-model="formData.partnerCounterpartyAdditionalEmails[index]"
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
            @click="removePartnerCounterpartyEmailField(index)"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Шаг 3: Данные контрагента -->
  <div v-if="stepData.stepNumber === 3">
    <h3 class="text-h6 mb-4">Данные контрагента</h3>
    
    <!-- Вид контрагента -->
    <v-autocomplete
      v-model="formData.partnerCounterpartyCounterpartyType"
      :items="counterpartyTypeOptions"
      label="Вид контрагента"
      placeholder="Выберите вид контрагента"
      :rules="[v => !!v || 'Вид контрагента обязателен']"
      item-title="title"
      item-value="id"
      variant="outlined"
      required
      class="mb-4"
      @update:model-value="resetPartnerCounterpartySpecificFields"
    ></v-autocomplete>
    
    <!-- ИНН -->
    <v-text-field
      v-model="formData.partnerCounterpartyInn"
      label="ИНН"
      placeholder="Введите ИНН"
      :rules="getInnRules()"
      maxlength="12"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Наименование -->
    <v-text-field
      v-model="formData.partnerCounterpartyCounterpartyName"
      label="Наименование"
      placeholder="Укажите полное наименование контрагента"
      :rules="[v => !!v || 'Наименование обязательно']"
      :maxlength="100"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Сокр. наименование -->
    <v-text-field
      v-model="formData.partnerCounterpartyShortName"
      label="Сокр. наименование"
      placeholder="Укажите сокращенное наименование"
      :rules="[v => !!v || 'Сокращенное наименование обязательно']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Конкретные поля для ЮЛ и ОПЮЛ -->
    <div v-if="['17941', '17943'].includes(formData.partnerCounterpartyCounterpartyType)">
      <!-- КПП -->
      <v-text-field
        v-model="formData.partnerCounterpartyKpp"
        label="КПП"
        placeholder="Введите КПП"
        :rules="kppRules"
        :maxlength="9"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОГРН -->
      <v-text-field
        v-model="formData.partnerCounterpartyOgrn"
        label="ОГРН"
        placeholder="Введите ОГРН"
        :rules="ogrnRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- ОКПО -->
      <v-text-field
        v-model="formData.partnerCounterpartyOkpo"
        label="ОКПО"
        placeholder="Введите ОКПО"
        :rules="okpoRules"
        :maxlength="10"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ОПЮЛ -->
    <div v-if="formData.partnerCounterpartyCounterpartyType === '17943'">
      <!-- ИНН Головного контрагента -->
      <v-text-field
        v-model="formData.partnerCounterpartyHeadInn"
        label="ИНН Головного контрагента"
        placeholder="Введите ИНН головного контрагента"
        :rules="[v => !!v || 'ИНН головного контрагента обязателен']"
        :maxlength="12"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Головной контрагент -->
      <v-text-field
        v-model="formData.partnerCounterpartyHeadCounterparty"
        label="Головной контрагент"
        placeholder="Укажите головного контрагента"
        :rules="[v => !!v || 'Головной контрагент обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ФЛ -->
    <div v-if="formData.partnerCounterpartyCounterpartyType === '17945'">
      <v-text-field
        v-model="formData.partnerCounterpartyIdentityDocument"
        label="Документ удост. личность"
        placeholder="Укажите реквизиты документа, удостоверяющего личность"
        :rules="[v => !!v || 'Документ обязателен']"
        :maxlength="150"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поле для ИП -->
    <div v-if="formData.partnerCounterpartyCounterpartyType === '17947'">
      <v-text-field
        v-model="formData.partnerCounterpartyOgrnip"
        label="ОГРНИП"
        placeholder="Введите ОГРНИП"
        :rules="ogrnipRules"
        :maxlength="15"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Поля для ЮЛН -->
    <div v-if="formData.partnerCounterpartyCounterpartyType === '17949'">
      <!-- Страна регистрации -->
      <v-autocomplete
        v-model="formData.partnerCounterpartyRegistrationCountry"
        :items="registrationCountryOptions"
        item-title="NAME"
        item-value="NAME"
        label="Страна регистрации"
        placeholder="Выберите страну регистрации"
        :rules="[v => !!v || 'Страна регистрации обязательна']"
        variant="outlined"
        class="mb-4"
      ></v-autocomplete>
      
      <!-- Рег. номер -->
      <v-text-field
        v-model="formData.partnerCounterpartyRegistrationNumber"
        label="Рег. номер"
        placeholder="Укажите регистрационный номер в стране регистрации"
        :rules="[v => !!v || 'Регистрационный номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
      
      <!-- Налоговый номер -->
      <v-text-field
        v-model="formData.partnerCounterpartyTaxNumber"
        label="Налоговый номер"
        placeholder="Укажите налоговый номер страны регистрации"
        :rules="[v => !!v || 'Налоговый номер обязателен']"
        :maxlength="50"
        variant="outlined"
        counter
        class="mb-4"
      ></v-text-field>
    </div>
    
    <!-- Юридический адрес -->
    <v-text-field
      v-model="formData.partnerCounterpartyLegalAddress"
      label="Юридический адрес"
      placeholder="Укажите юридический адрес"
      :rules="[v => !!v || 'Юридический адрес обязателен']"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Фактический адрес -->
    <v-text-field
      v-model="formData.partnerCounterpartyActualAddress"
      label="Фактический адрес"
      placeholder="Укажите фактический адрес"
      :maxlength="250"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Телефон -->
    <v-text-field
      v-model="formData.partnerCounterpartyPhone2"
      label="Телефон"
      v-mask="'+7 (###) ###-##-##'"
      placeholder="Укажите номер в формате +7 (999) 999 99 99"
      :rules="phoneRules"
      :maxlength="20"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Электронная почта -->
    <v-text-field
      v-model="formData.partnerCounterpartyEmail2"
      label="Электронная почта"
      placeholder="Укажите email в формате name@domain.com"
      :rules="emailRules"
      :maxlength="50"
      variant="outlined"
      counter
      class="mb-4"
    ></v-text-field>
    
    <!-- Контактное лицо -->
    <v-text-field
      v-model="formData.partnerCounterpartyContactPerson"
      label="Контактное лицо"
      placeholder="Укажите ФИО контактного лица"
      :rules="[v => !!v || 'Контактное лицо обязательно']"
      :maxlength="150"
      variant="outlined"
      counter
      class="mb-4"
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
            class="mx-6 mb-6"
            closable
            @click:close="submitStatus = null"
          >
            <div>
              <v-btn
                v-if="submitStatus.type === 'success'"
                :href="submitStatus.requestUrl"
                target="_blank"
                variant="text"
                color="inherit"
                size="small"
                class="pa-0 ma-0 text-decoration-underline"
              >
                Заявка №{{ submitStatus.itemId }}
              </v-btn>
              {{ submitStatus.message }}
            </div>
          </v-alert>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { callApi, getListElements } from '../functions/callApi'
import { mask } from 'vue-the-mask'
import LoadingProgress from '../components/LoadingProgress.vue'

const isLoading = ref(true)
const loadingMessage = ref('Инициализация формы...')

const onLoadingComplete = () => {
  console.log('Загрузка завершена')
  // Можно выполнить дополнительные действия после завершения загрузки
}

const vMask = mask
// Состояние формы
const currentStep = ref(1)
const formValid = ref(false)
const isSubmitting = ref(false)
const form = ref(null)
const submitStatus = ref(null)
const isLoadingRequestTypes = ref(false)

const getInnPlaceholder = () => {
  if (['17941', '17943'].includes(formData.counterpartyType)) {
    return 'Введите ИНН (10 символов)'
  } else if (['17945', '17947', '17949'].includes(formData.counterpartyType)) {
    return 'Введите ИНН (12 символов)'
  }
  return 'Введите ИНН'
}

const getInnMaxLength = () => {
  if (['17941', '17943'].includes(formData.counterpartyType)) {
    return 10
  } else if (['17945', '17947', '17949'].includes(formData.counterpartyType)) {
    return 12
  }
  return 12
}
const agreementOperationOptions = ref([
  { id: 'sale', title: 'Продажа' },
  { id: 'purchase', title: 'Закупка' },
  { id: 'rent', title: 'Аренда' },
  { id: 'service', title: 'Обслуживание' },
  { id: 'partnership', title: 'Партнерство' }
])

// Опции для типов соглашений
const agreementTypeOptions = ref([
  { id: 'contract', title: 'Договор' },
  { id: 'agreement', title: 'Соглашение' },
  { id: 'addendum', title: 'Дополнительное соглашение' },
  { id: 'protocol', title: 'Протокол' },
  { id: 'memorandum', title: 'Меморандум' }
])

// Опции для типовых соглашений (для автозаполнения)
const typicalAgreementOptions = ref([
  { id: 'standard1', title: 'Типовой договор поставки' },
  { id: 'standard2', title: 'Типовой договор оказания услуг' },
  { id: 'standard3', title: 'Типовое соглашение о конфиденциальности' },
  { id: 'standard4', title: 'Типовой договор аренды' },
  { id: 'standard5', title: 'Типовое партнерское соглашение' }
])
// Данные формы
// Данные формы
const formData = reactive({
  // Основные поля шага 1
  date: new Date().toLocaleDateString('ru-RU'),
  type: null, // '16931', '16933', '16935'
  object: '',
  comment: '',
  
  // Поля для объекта "Контрагенты" (16937)
  counterpartyType: null,
  partner: '',
  partnerCode: '',
  inn: '',
  name: '',
  shortName: '',
  kpp: '',
  ogrn: '',
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
  
  // Поля для объекта "Партнеры" (16939)
  partnerType: null,
  businessRegion: [],
  relationshipType: [],
  categoryB2: '',
  categoryCA: '',
  ckg: '',
  ckgB2B: '',
  isNonResident: false,
  additionalPhones: [],
  additionalEmails: [],
  
  // Поля для объекта "Банковские счета" (16941)
  bankAccountStatus: '',
  counterparty: '',
  counterpartyInn: '',
  bankType: '',
  bik: '',
  bankName: '',
  currency: '',
  accountNumber: '',
  correspondentAccount: '',
  bankAddress: '',
  swift: '',
  bankRegistrationCity: '',
  
  // Поля для объекта "Типовые соглашения" (16963)
  typicalAgreementBasis: '',
  typicalAgreementBasisFile: null,
  typicalAgreementName: '',
  typicalAgreementTerms: '',
  typicalAgreementOperation: '',
  typicalAgreementDepartment: '',
  typicalAgreementPeriodFrom: '',
  typicalAgreementPeriodTo: false,
  typicalAgreementCurrency: '',
  typicalAgreementSchedule: '',
  typicalAgreementAdditional: '',
  
  // Поля для объекта "Индивидуальные соглашения" (17957)
  individualAgreementBasis: '',
  individualAgreementBasisFile: null,
  individualAgreementName: '',
  individualAgreementPartner: '',
  individualAgreementOrganization: '',
  individualAgreementDate: '',
  individualAgreementPeriodFrom: '',
  individualAgreementPeriodTo: false,
  individualAgreementNumber: '',
  individualAgreementOperation: '',
  individualAgreementType: '',
  individualAgreementTypical: '',
  individualAgreementPaymentSchedule: '',
  individualAgreementCurrency: '',
  individualAgreementPricing: '',
  individualAgreementAdditional: '',
  
  // Поля для объекта "Договоры" (16943)
  contractPurpose: '',
  contractNumber: '',
  contractDate: '',
  contractPeriodFrom: '',
  contractPeriodTo: '',
  contractName: '',
  department: '',
  organization: '',
  organizationInn: '',
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
  vatDeclarationOperation: '',
  
  // Поля для объекта "Склады" (16945)
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
  
  // Поля для объекта "Упаковки" (16947)
  nomenclature: '',
  nomenclatureCodes: '',
  additionalInfo: '',
  measurementUnit: '',
  packageComposition: '',
  weight: '',
  height: '',
  width: '',
  depth: '',
  volume: '',
  packageName: '',
  
  // Поля для объекта "Скидки (наценки)" (16959)
  discountBasis: '',
  discountBasisFile: null,
  discountName: '',
  discountType: '',
  salesChannel: '',
  discountPeriodFrom: '',
  discountPeriodTo: '',
  discountSelections: '',
  discountMechanics: '',
  discountAdditional: '',
  
  // Поля для объекта "Цены (прайс-лист)" (16961)
  priceBasis: '',
  priceBasisFile: null,
  priceChangeReason: '',
  pricePeriodFrom: '',
  pricePeriodTo: '',
  priceDepartment: '',
  priceAdditional: '',
  
  // Поля для объекта "Контрагент/Договор" (17961)
  complexCounterpartyType: null,
  complexInn: '',
  complexName: '',
  complexShortName: '',
  complexKpp: '',
  complexOgrn: '',
  complexOkpo: '',
  complexHeadInn: '',
  complexHeadCounterparty: '',
  complexIdentityDocument: '',
  complexOgrnip: '',
  complexRegistrationCountry: '',
  complexRegistrationNumber: '',
  complexTaxNumber: '',
  complexLegalAddress: '',
  complexActualAddress: '',
  complexPhone: '',
  complexEmail: '',
  complexContactPerson: '',
  complexContractPurpose: '',
  complexContractNumber: '',
  complexContractDate: '',
  complexContractPeriodFrom: '',
  complexContractPeriodTo: '',
  complexContractName: '',
  complexDepartment: '',
  complexOrganization: '',
  complexOrganizationInn: '',
  complexOrganizationAccount: '',
  complexPartner: '',
  complexPaymentDetails: '',
  complexCurrency: '',
  complexForeignCurrencyPayment: false,
  complexFixedContractAmount: false,
  complexAllowSubsidiaryPartners: false,
  complexLabeledProducts: '',
  complexProhibitShipment: false,
  complexDontShipOnDebt: false,
  complexDebtAmount: '',
  complexVatRate: '',
  complexFinancialGroup: '',
  complexDdsArticle: '',
  complexDebtClassification: '',
  complexVatDeclarationOperation: '',
  complexHasFile: null,
  
  // Поля для объекта "Партнер/Контрагент/Договор" (17959)
  combinedPartnerType: null,
  combinedPartnerName: '',
  combinedPhone: '',
  combinedAdditionalPhones: [],
  combinedEmail: '',
  combinedAdditionalEmails: [],
  combinedBusinessRegion: [],
  combinedRelationshipType: [],
  combinedLegalAddress: '',
  combinedActualAddress: '',
  combinedCopyAddress: false,
  combinedCategoryB2: '',
  combinedCategoryCA: '',
  combinedCkg: '',
  combinedCkgB2B: '',
  combinedCounterpartyType: null,
  combinedInn: '',
  combinedCounterpartyName: '',
  combinedShortName: '',
  combinedKpp: '',
  combinedOgrn: '',
  combinedOkpo: '',
  combinedHeadInn: '',
  combinedHeadCounterparty: '',
  combinedIdentityDocument: '',
  combinedOgrnip: '',
  combinedRegistrationCountry: '',
  combinedRegistrationNumber: '',
  combinedTaxNumber: '',
  combinedCounterpartyLegalAddress: '',
  combinedCounterpartyActualAddress: '',
  combinedCounterpartyPhone: '',
  combinedCounterpartyEmail: '',
  combinedContactPerson: '',
  combinedContractPurpose: '',
  combinedContractNumber: '',
  combinedContractDate: '',
  combinedContractPeriodFrom: '',
  combinedContractPeriodTo: '',
  combinedContractName: '',
  combinedDepartment: '',
  combinedOrganization: '',
  combinedOrganizationInn: '',
  combinedOrganizationAccount: '',
  combinedPaymentDetails: '',
  combinedCurrency: '',
  combinedForeignCurrencyPayment: false,
  combinedFixedContractAmount: false,
  combinedAllowSubsidiaryPartners: false,
  combinedLabeledProducts: '',
  combinedProhibitShipment: false,
  combinedDontShipOnDebt: false,
  combinedDebtAmount: '',
  combinedVatRate: '',
  combinedFinancialGroup: '',
  combinedDdsArticle: '',
  combinedDebtClassification: '',
  combinedVatDeclarationOperation: '',
  combinedHasFile: null,
  
  // Поля для объекта "Партнер/Контрагент" (18003)
  partnerCounterpartyPartnerType: null,
  partnerCounterpartyName: '',
  partnerCounterpartyPhone: '',
  partnerCounterpartyAdditionalPhones: [],
  partnerCounterpartyEmail: '',
  partnerCounterpartyAdditionalEmails: [],
  partnerCounterpartyBusinessRegion: [],
  partnerCounterpartyRelationshipType: [],
  partnerCounterpartyLegalAddress: '',
  partnerCounterpartyActualAddress: '',
  partnerCounterpartyCopyAddress: false,
  partnerCounterpartyCategoryB2: '',
  partnerCounterpartyCategoryCA: '',
  partnerCounterpartyCkg: '',
  partnerCounterpartyCkgB2B: '',
  partnerCounterpartyCounterpartyType: null,
  partnerCounterpartyInn: '',
  partnerCounterpartyCounterpartyName: '',
  partnerCounterpartyShortName: '',
  partnerCounterpartyKpp: '',
  partnerCounterpartyOgrn: '',
  partnerCounterpartyOkpo: '',
  partnerCounterpartyHeadInn: '',
  partnerCounterpartyHeadCounterparty: '',
  partnerCounterpartyIdentityDocument: '',
  partnerCounterpartyOgrnip: '',
  partnerCounterpartyRegistrationCountry: '',
  partnerCounterpartyRegistrationNumber: '',
  partnerCounterpartyTaxNumber: '',
  partnerCounterpartyLegalAddress2: '',
  partnerCounterpartyActualAddress2: '',
  partnerCounterpartyPhone2: '',
  partnerCounterpartyEmail2: '',
  partnerCounterpartyContactPerson: '',
  
  // Общие поля для файлов
  hasFile: null,
  
  // Поля для ошибок
  errorDescription: '',
  
  // Поля для вида заявки (если используется)
  view: '',
  
  // Дополнительные поля для индивидуальных нужд
  activityDirection: '',
  typeSize: '',
  additionalInfoSecondary: '',
  discountNomenclatureCode: '',
  discountNomenclatureName: '',
  priceBeforeDiscount: '',
  priceWithDiscount: '',
  discountComment: '',
  priceNomenclatureCode: '',
  priceNomenclatureName: '',
  priceType: '',
  priceBefore: '',
  priceAfter: '',
  priceComment: '',
  
  // Поля для физических лиц
  birthDate: '',
  gender: '',
  
  // Поля для сложных объектов (старые названия для совместимости)
  ogrnip: '',
  
  // Поля для ИП
  headInn2: '',
  headCounterparty2: ''
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

const salesChannelOptions = ref([
    { id: '0', title: 'B2B' },
    { id: '1', title: 'B2C' },
    { id: '2', title: 'B2G' },
    { id: '3', title: 'Маркетплейс' },
    { id: '4', title: 'Слуховые аппараты' },
])

const discountTypeOptions = ref([
    { id: '0', title: 'Процент' },
    { id: '1', title: 'Количество продукции' },
    { id: '2', title: 'Специальная цена' },
    { id: '3', title: 'Подарок' },
    { id: '4', title: 'Промокод' },
    { id: '5', title: 'Карта лояльности' },
    { id: '6', title: 'Добавление' },
    { id: '7', title: 'Изменение' },
    { id: '8', title: 'Ошибка/ доработка' },
])
// Опции для Контрагентов
const counterpartyTypeOptions = ref([
  { id: '17941', title: 'ЮЛ (Юридическое лицо)' },
  { id: '17943', title: 'ОПЮЛ (Обособленное подразделение юридического лица)' },
  { id: '17945', title: 'ФЛ (Физическое лицо)', },
  { id: '17947', title: 'ИП (Индивидуальный предприниматель)', },
  { id: '17949', title: 'ЮЛН (Юридическое лицо нерезедент)', }
])

// Опции для Партнеров
const partnerTypeOptions = ref([
  { id: '16961', title: 'КП (компания)' },
  { id: '16963', title: 'ЧЛ (частное лицо)', }
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
  { id: 'supplier', title: 'Клиент' },
  { id: 'customer', title: 'Поставщиĸ' },
  { id: 'partner', title: 'Прочие отношения' },
  { id: 'distributor', title: 'Перевозчиĸ' },
  { id: 'reseller', title: 'Получатель ТСР' },
  { id: 'reseller', title: 'Обслуживается торговыми представителями' },
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
  { id: 'option1', title: 'Не выбывает из оборота' },
  { id: 'option2', title: 'Выбывает из оборота по причине исп. поĸупателем для собственных нужд' },
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
const resetCounterpartySpecificFields = () => {
  // Сбрасываем специфичные поля при изменении вида контрагента
  formData.kpp = ''
  formData.ogrn = ''
  formData.okpo = ''
  formData.headInn = ''
  formData.headCounterparty = ''
  formData.identityDocument = ''
  formData.ogrnip = ''
  formData.registrationCountry = ''
  formData.registrationNumber = ''
  formData.taxNumber = ''
}
// Настройки шагов для каждого типа заявки и объекта НСИ
const stepConfigs = {
  // Для объекта "Партнёр/ Контрагент" (18003)
  '18003': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные контрагента', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Данные партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные контрагента', subtitle: 'Шаг 3' }
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
  '17961': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные контрагента', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные договора', subtitle: 'Шаг 3' }
      ],
      totalSteps: 3
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск данных', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных', subtitle: 'Шаг 3' }
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
'16963': {
  '16931': { // Добавление
    steps: [
      { stepNumber: 2, title: 'Данные типового соглашения', subtitle: 'Шаг 2' }
    ],
    totalSteps: 2
  },
  '16933': { // Изменение
    steps: [
      { stepNumber: 2, title: 'Поиск типового соглашения', subtitle: 'Шаг 2' },
      { stepNumber: 3, title: 'Изменение данных соглашения', subtitle: 'Шаг 3' }
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

// Для объекта "Индивидуальные соглашения" (17957)
'17957': {
  '16931': { // Добавление
    steps: [
      { stepNumber: 2, title: 'Данные индивидуального соглашения', subtitle: 'Шаг 2' }
    ],
    totalSteps: 2
  },
  '16933': { // Изменение
    steps: [
      { stepNumber: 2, title: 'Изменение данных соглашения', subtitle: 'Шаг 2' }
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
  // Для объекта "Комплексное добавление: Партнер + Контрагент + Договор" (17959)
  '17959': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные контрагента', subtitle: 'Шаг 3' },
        { stepNumber: 4, title: 'Данные договора', subtitle: 'Шаг 4' }
      ],
      totalSteps: 4
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Данные партнера', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Данные контрагента', subtitle: 'Шаг 3' },
        { stepNumber: 4, title: 'Данные договора', subtitle: 'Шаг 4' }
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
  // Для объекта "Скидки" (16959)
  '16959': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные скидки', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск скидки', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных скидки', subtitle: 'Шаг 3' }
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

  // Для объекта "Цены" (16961)
  '16961': {
    '16931': { // Добавление
      steps: [
        { stepNumber: 2, title: 'Данные цены', subtitle: 'Шаг 2' }
      ],
      totalSteps: 2
    },
    '16933': { // Изменение
      steps: [
        { stepNumber: 2, title: 'Поиск цены', subtitle: 'Шаг 2' },
        { stepNumber: 3, title: 'Изменение данных цены', subtitle: 'Шаг 3' }
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
const discountMechanicsOptions = ref([
  { id: 'fixed_price', title: 'Фиксированная цена' },
  { id: 'percentage', title: 'Процентная скидка' },
  { id: 'quantity_based', title: 'Скидка от количества' },
  { id: 'seasonal', title: 'Сезонная скидка' },
  { id: 'promotional', title: 'Акционная цена' }
])
const priceTypeOptions = ref([
  { id: 'wholesale', title: 'Оптовая' },
  { id: 'retail', title: 'Розничная' },
  { id: 'special', title: 'Специальная' },
  { id: 'contract', title: 'Договорная' },
  { id: 'promo', title: 'Промо-цена' },
  { id: 'discount', title: 'Цена со скидкой' }
])

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

const getInnRules = () => [
  v => !!v || 'ИНН обязателен',
  v => (/^\d{10}$/.test(v) || /^\d{12}$/.test(v)) || 'ИНН должен содержать 10 или 12 цифр'
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
  v => !!v || 'Телефон обязателен',
  v => {
    // Убираем все нецифровые символы для проверки
    const cleanPhone = v ? v.replace(/\D/g, '') : ''
    return cleanPhone.length >= 8 && cleanPhone.length <= 12 || 'Телефон должен содержать от 8 до 12 цифр'
  },
  v => {
    if (!v) return true
    // Проверяем формат: +7, 8, или начинается с цифры
    const cleanPhone = v.replace(/\D/g, '')
    const isValidStart = /^[78]/.test(cleanPhone) || cleanPhone.length === 10
    return isValidStart || 'Телефон должен начинаться с +7, 8 или содержать 10 цифр'
  }
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
  v => (/^\\d{10}$/.test(v) || /^\\d{12}$/.test(v)) || 'ИНН должен содержать 10 или 12 цифр'
];

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
const isAddType = computed(() => formData.type === '16931')
const isEditType = computed(() => formData.type === '16933')
const isErrorType = computed(() => formData.type === '16935')

// Навигация по шагам
const goToNextStep = async () => {
  // Проверяем валидацию для текущего шага
  const { valid } = await form.value.validate()
  
  if (!valid) {
    submitStatus.value = {
      type: 'warning',
      message: 'Заполните все обязательные поля на текущем шаге'
    }
    return
  }
  
  // Дополнительная проверка для типа "Добавление"
  if (isAddType.value && !canGoToNextStep.value) {
    submitStatus.value = {
      type: 'warning',
      message: 'Заполните все обязательные поля на текущем шаге'
    }
    return
  }
  
  const isLastStep = currentStep.value === totalSteps.value
  
  if (isLastStep) {
    await submitForm()
  } else if (currentStep.value < totalSteps.value) {
    currentStep.value++
    submitStatus.value = null // Сбрасываем статус при переходе на следующий шаг
  }
}
// Проверка возможности перехода на следующий шаг
const canGoToNextStep = computed(() => {
  if (currentStep.value === 1) {
    // Шаг 1 всегда требует заполнения основных полей
    return !!formData.type && !!formData.object
  }
  
  // Для шагов 2+ разная логика
  if (isAddType.value) {
    // Для добавления - проверяем ВСЕ обязательные поля на текущем шаге
    return checkRequiredFieldsForCurrentStep()
  } else {
    // Для изменения и ошибки - всегда true (проверка на уровне отправки)
    return true
  }
})

// Функция проверки обязательных полей для текущего шага
const checkRequiredFieldsForCurrentStep = () => {
  // Определяем, какие поля обязательны для текущего шага
     if (formData.object === '17961') {
    if (currentStep.value === 2) {
      // Проверяем обязательные поля для данных контрагента (кроме чекбоксов и файлов)
      return !!formData.complexCounterpartyType && 
             !!formData.complexInn && 
             !!formData.complexName &&
             !!formData.complexShortName &&
             !!formData.complexLegalAddress
    } else if (currentStep.value === 3) {
      // Проверяем обязательные поля для данных договора (кроме чекбоксов и файлов)
      return !!formData.complexContractPurpose && 
             !!formData.complexContractNumber && 
             !!formData.complexContractDate && 
             !!formData.complexContractName && 
             !!formData.complexOrganization &&
             !!formData.complexCurrency
    }
  }
  
  // Для объекта 17959 (Партнер + Контрагент + Договор)
  else if (formData.object === '17959') {
    if (currentStep.value === 2) {
      // Проверяем обязательные поля для данных партнера (кроме чекбоксов и файлов)
      const partnerFieldsValid = !!formData.combinedPartnerType && 
             !!formData.combinedPartnerName
      
      // Для КП (компания) проверяем дополнительные поля
      if (formData.combinedPartnerType === '16961') {
        return partnerFieldsValid &&
               !!formData.combinedPhone &&
               !!formData.combinedEmail &&
               !!formData.combinedLegalAddress &&
               formData.combinedBusinessRegion && formData.combinedBusinessRegion.length > 0
      }
      // Для ЧЛ (частное лицо)
      else if (formData.combinedPartnerType === '16963') {
        return partnerFieldsValid &&
               !!formData.combinedPhone &&
               !!formData.combinedEmail
      }
      
      return false
    } 
    else if (currentStep.value === 3) {
      // Проверяем обязательные поля для данных контрагента (кроме чекбоксов и файлов)
      return !!formData.combinedCounterpartyType && 
             !!formData.combinedInn && 
             !!formData.combinedCounterpartyName &&
             !!formData.combinedShortName &&
             !!formData.combinedCounterpartyLegalAddress
    } 
    else if (currentStep.value === 4) {
      // Проверяем обязательные поля для данных договора (кроме чекбоксов и файлов)
      return !!formData.combinedContractPurpose && 
             !!formData.combinedContractNumber && 
             !!formData.combinedContractDate && 
             !!formData.combinedContractName && 
             !!formData.combinedOrganization &&
             !!formData.combinedCurrency
    }
  }
  
  // Для объекта 18003 (Партнер + Контрагент)
  else if (formData.object === '18003') {
    if (currentStep.value === 2) {
      // Проверяем обязательные поля для данных партнера (кроме чекбоксов и файлов)
      const partnerFieldsValid = !!formData.partnerCounterpartyPartnerType && 
             !!formData.partnerCounterpartyName
      
      // Для КП (компания) проверяем дополнительные поля
      if (formData.partnerCounterpartyPartnerType === '16961') {
        return partnerFieldsValid &&
               !!formData.partnerCounterpartyPhone &&
               !!formData.partnerCounterpartyEmail &&
               !!formData.partnerCounterpartyLegalAddress &&
               formData.partnerCounterpartyBusinessRegion && formData.partnerCounterpartyBusinessRegion.length > 0
      }
      // Для ЧЛ (частное лицо)
      else if (formData.partnerCounterpartyPartnerType === '16963') {
        return partnerFieldsValid &&
               !!formData.partnerCounterpartyPhone &&
               !!formData.partnerCounterpartyEmail
      }
      
      return false
    } 
    else if (currentStep.value === 3) {
      // Проверяем обязательные поля для данных контрагента (кроме чекбоксов и файлов)
      return !!formData.partnerCounterpartyCounterpartyType && 
             !!formData.partnerCounterpartyInn && 
             !!formData.partnerCounterpartyCounterpartyName &&
             !!formData.partnerCounterpartyShortName &&
             !!formData.partnerCounterpartyLegalAddress
    }
  } else if (formData.object === '16937') { // Контрагенты
      if (currentStep.value === 2) {
        // Общие обязательные поля для всех видов контрагентов
        let requiredFields = [
          !!formData.partnerCode,
          !!formData.partner,
          !!formData.counterpartyType,
          !!formData.inn,
          !!formData.name,
          !!formData.shortName,
          !!formData.legalAddress,
          !!formData.phone,
          !!formData.email,
          !!formData.contactPerson
        ]
        
        // Дополнительные поля в зависимости от вида контрагента
        if (formData.counterpartyType === '17941' || formData.counterpartyType === '17943') { // ЮЛ, ОПЮЛ
          requiredFields.push(!!formData.kpp, !!formData.ogrn, !!formData.okpo)
        }
        
        if (formData.counterpartyType === '17943') { // ОПЮЛ
          requiredFields.push(!!formData.headInn, !!formData.headCounterparty)
        }
        
        if (formData.counterpartyType === '17945') { // ФЛ
          requiredFields.push(!!formData.identityDocument)
        }
        
        if (formData.counterpartyType === '17947') { // ИП
          requiredFields.push(!!formData.ogrnip)
        }
        
        if (formData.counterpartyType === '17949') { // ЮЛН
          requiredFields.push(!!formData.registrationCountry, !!formData.registrationNumber, !!formData.taxNumber)
        }
        
        return requiredFields.every(field => field)
      }
  } else if (formData.object === '16963') { // Типовые соглашения
    if (currentStep.value === 2) {
      return !!formData.typicalAgreementName && 
            !!formData.typicalAgreementTerms && 
            !!formData.typicalAgreementOperation
    }
  } else if (formData.object === '17957') { // Индивидуальные соглашения
    if (currentStep.value === 2) {
      return !!formData.individualAgreementName && 
            !!formData.individualAgreementPartnerCode && 
            !!formData.individualAgreementPartner && 
            !!formData.individualAgreementOrganization && 
            !!formData.individualAgreementOperation
    }
  } else if (formData.object === '16939') { // Партнеры
    if (currentStep.value === 2) {
      if (formData.partnerType === '16961') { // КП
        return !!formData.name && 
               !!formData.partnerCode && 
               formData.businessRegion && formData.businessRegion.length > 0 &&
               !!formData.phone &&
               !!formData.email &&
               !!formData.legalAddress
      } else if (formData.partnerType === '16963') { // ЧЛ
        return !!formData.name && 
               !!formData.partnerCode && 
               !!formData.partner &&
               !!formData.phone &&
               !!formData.email
      }
    } else if (currentStep.value === 3) {
      return true // Файлы не обязательны
    }
  } else if (formData.object === '16943') { // Договоры
    if (currentStep.value === 2) {
      return !!formData.contractPurpose && 
             !!formData.contractNumber && 
             !!formData.contractDate && 
             !!formData.contractName && 
             !!formData.organization &&
             !!formData.partnerCode && 
             !!formData.partner && 
             !!formData.paymentDetails && 
             !!formData.currency
    }
  } else if (formData.object === '16941') { // Банковские счета
    if (currentStep.value === 2) {
      return !!formData.bankAccountStatus && 
             !!formData.counterpartyInn && 
             !!formData.counterparty && 
             !!formData.bankType
    } else if (currentStep.value === 3) {
      if (formData.bankType === 'national') {
        return !!formData.bik && 
               !!formData.bankName && 
               !!formData.currency && 
               !!formData.accountNumber && 
               !!formData.correspondentAccount
      } else if (formData.bankType === 'international') {
        return !!formData.swift && 
               !!formData.bankName && 
               !!formData.bankRegistrationCity && 
               !!formData.currency && 
               !!formData.accountNumber && 
               !!formData.correspondentAccount
      }
    }
  } else if (formData.object === '16945') { // Склады
    if (currentStep.value === 2) {
      return !!formData.warehouseType && 
             !!formData.warehouseName && 
             !!formData.warehouseCode
    }
  } else if (formData.object === '16947') { // Упаковки
    if (currentStep.value === 2) {
      return !!formData.nomenclature && 
             !!formData.measurementUnit && 
             !!formData.packageComposition
    }
  } else if (formData.object === '16959') { // Скидки
    if (currentStep.value === 2) {
      return !!formData.discountName
    }
  } else if (formData.object === '16961') { // Цены
    if (currentStep.value === 2) {
      return !!formData.priceNomenclatureCode && 
             !!formData.priceNomenclatureName && 
             !!formData.priceType && 
             !!formData.priceBefore && 
             !!formData.priceAfter
    }
  }
  
  return true
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
  if (formData.object === '17961') {
    //resetComplexFields17961()
  } else if (formData.object === '17959') {
    //resetComplexFields17959()
  } else if (formData.object === '18003') {
    //resetComplexFields18003()
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
const getAllRequestFields = () => {
  const fields = []
  
  // Основные поля шага 1
  fields.push('=== ОСНОВНЫЕ ДАННЫЕ ===')
  fields.push(`Тип заявки: ${getRequestTypeTitle(formData.type)}`)
  fields.push(`Объект MDM: ${getNsiObjectTitle(formData.object)}`)
  
  if (formData.comment) {
    fields.push(`Комментарий: ${formData.comment}`)
  }
  
  // Поля для объекта "Контрагенты" (16937)
  if (formData.object === '16937') {
    fields.push('\n=== ДАННЫЕ КОНТРАГЕНТА ===')
    fields.push(`Вид контрагента: ${getCounterpartyTypeTitle(formData.counterpartyType)}`)
    if (formData.partner) fields.push(`Партнер: ${formData.partner}`)
    if (formData.partnerCode) fields.push(`Код партнера: ${formData.partnerCode}`)
    if (formData.inn) fields.push(`ИНН: ${formData.inn}`)
    if (formData.name) fields.push(`Наименование: ${formData.name}`)
    if (formData.shortName) fields.push(`Сокр. наименование: ${formData.shortName}`)
    
    // Специфичные поля для ЮЛ и ОПЮЛ
    if (['17941', '17943'].includes(formData.counterpartyType)) {
      if (formData.kpp) fields.push(`КПП: ${formData.kpp}`)
      if (formData.ogrn) fields.push(`ОГРН: ${formData.ogrn}`)
      if (formData.okpo) fields.push(`ОКПО: ${formData.okpo}`)
    }
    
    // Поля для ОПЮЛ
    if (formData.counterpartyType === '17943') {
      if (formData.headInn) fields.push(`ИНН Головного контрагента: ${formData.headInn}`)
      if (formData.headCounterparty) fields.push(`Головной контрагент: ${formData.headCounterparty}`)
    }
    
    // Поле для ФЛ
    if (formData.counterpartyType === '17945' && formData.identityDocument) {
      fields.push(`Документ удост. личность: ${formData.identityDocument}`)
    }
    
    // Поле для ИП
    if (formData.counterpartyType === '17947' && formData.ogrnip) {
      fields.push(`ОГРНИП: ${formData.ogrnip}`)
    }
    
    // Поля для ЮЛН
    if (formData.counterpartyType === '17949') {
      if (formData.registrationCountry) fields.push(`Страна регистрации: ${formData.registrationCountry}`)
      if (formData.registrationNumber) fields.push(`Рег. номер: ${formData.registrationNumber}`)
      if (formData.taxNumber) fields.push(`Налоговый номер: ${formData.taxNumber}`)
    }
    
    if (formData.legalAddress) fields.push(`Юридический адрес: ${formData.legalAddress}`)
    if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
    if (formData.copyAddress) fields.push(`Копировать адрес: Да`)
    if (formData.phone) fields.push(`Телефон: ${formData.phone}`)
    if (formData.email) fields.push(`Электронная почта: ${formData.email}`)
    if (formData.contactPerson) fields.push(`Контактное лицо: ${formData.contactPerson}`)
  }
  
  // Поля для объекта "Партнеры" (16939)
  else if (formData.object === '16939') {
    fields.push('\n=== ДАННЫЕ ПАРТНЕРА ===')
    fields.push(`Вид партнера: ${getPartnerTypeTitle(formData.partnerType)}`)
    
    if (formData.name) fields.push(`Наименование: ${formData.name}`)
    
    // Телефоны
    if (formData.phone) {
      fields.push(`Телефон: ${formData.phone}`)
    }
    if (formData.additionalPhones && formData.additionalPhones.length > 0) {
      formData.additionalPhones.forEach((phone, index) => {
        if (phone) fields.push(`Телефон ${index + 2}: ${phone}`)
      })
    }
    
    // Emails
    if (formData.email) {
      fields.push(`Электронная почта: ${formData.email}`)
    }
    if (formData.additionalEmails && formData.additionalEmails.length > 0) {
      formData.additionalEmails.forEach((email, index) => {
        if (email) fields.push(`Email ${index + 2}: ${email}`)
      })
    }
    
    if (formData.businessRegion && formData.businessRegion.length > 0) {
      const regions = formData.businessRegion.map(id => {
        const item = businessRegionOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Бизнес-регион: ${regions}`)
    }
    
    if (formData.relationshipType && formData.relationshipType.length > 0) {
      const relationships = formData.relationshipType.map(id => {
        const item = relationshipTypeOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Тип отношений: ${relationships}`)
    }
    
    if (formData.legalAddress) fields.push(`Юридический адрес: ${formData.legalAddress}`)
    if (formData.actualAddress) fields.push(`Фактический адрес: ${formData.actualAddress}`)
    if (formData.copyAddress) fields.push(`Копировать адрес: Да`)
    
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
    
    if (formData.isNonResident) {
      fields.push(`ЮЛН: Да`)
      if (formData.registrationCountry) fields.push(`Страна регистрации: ${formData.registrationCountry}`)
      if (formData.registrationNumber) fields.push(`Рег. номер: ${formData.registrationNumber}`)
      if (formData.taxNumber) fields.push(`Налоговый номер: ${formData.taxNumber}`)
    }
    
    if (formData.partner) fields.push(`Партнер (1С ERP): ${formData.partner}`)
  }
  
  // Поля для объекта "Банковские счета" (16941)
  else if (formData.object === '16941') {
    fields.push('\n=== ДАННЫЕ БАНКОВСКОГО СЧЕТА ===')
    
    if (formData.bankAccountStatus) {
      const item = bankAccountStatusOptions.value.find(item => item.id === formData.bankAccountStatus)
      fields.push(`Статус: ${item ? item.title : formData.bankAccountStatus}`)
    }
    
    if (formData.counterparty) fields.push(`Контрагент: ${formData.counterparty}`)
    if (formData.counterpartyInn) fields.push(`Контрагент ИНН: ${formData.counterpartyInn}`)
    
    if (formData.bankType) {
      const item = bankTypeOptions.value.find(item => item.id === formData.bankType)
      fields.push(`Вид банка: ${item ? item.title : formData.bankType}`)
    }
    
    // Для национального банка
    if (formData.bankType === 'national' || formData.bankType === '16971') {
      if (formData.bik) fields.push(`БИК: ${formData.bik}`)
      if (formData.bankName) fields.push(`Наименование банка: ${formData.bankName}`)
      if (formData.currency) {
        const item = currencyOptions.value.find(item => item.CURRENCY === formData.currency)
        fields.push(`Валюта: ${item ? item.FULL_NAME : formData.currency}`)
      }
      if (formData.accountNumber) fields.push(`Расчетный счет: ${formData.accountNumber}`)
      if (formData.correspondentAccount) fields.push(`Корреспондентский счет: ${formData.correspondentAccount}`)
      if (formData.bankAddress) fields.push(`Адрес банка: ${formData.bankAddress}`)
    }
    
    // Для международного банка
    else if (formData.bankType === 'international' || formData.bankType === '16973') {
      if (formData.swift) fields.push(`SWIFT: ${formData.swift}`)
      if (formData.bankName) fields.push(`Наименование банка: ${formData.bankName}`)
      if (formData.bankRegistrationCity) fields.push(`Страна регистрации и город: ${formData.bankRegistrationCity}`)
      if (formData.bankAddress) fields.push(`Адрес банка: ${formData.bankAddress}`)
      if (formData.currency) {
        const item = currencyOptions.value.find(item => item.CURRENCY === formData.currency)
        fields.push(`Валюта: ${item ? item.FULL_NAME : formData.currency}`)
      }
      if (formData.accountNumber) fields.push(`Расчетный счет: ${formData.accountNumber}`)
      if (formData.correspondentAccount) fields.push(`Корреспондентский счет: ${formData.correspondentAccount}`)
    }
  }
  
  // Поля для объекта "Типовые соглашения" (16963)
  else if (formData.object === '16963') {
    fields.push('\n=== ДАННЫЕ ТИПОВОГО СОГЛАШЕНИЯ ===')
    if (formData.typicalAgreementBasis) fields.push(`Основание: ${formData.typicalAgreementBasis}`)
    if (formData.typicalAgreementName) fields.push(`Наименование: ${formData.typicalAgreementName}`)
    if (formData.typicalAgreementTerms) fields.push(`Условия: ${formData.typicalAgreementTerms}`)
    
    if (formData.typicalAgreementOperation) {
      const item = agreementOperationOptions.value.find(item => item.id === formData.typicalAgreementOperation)
      fields.push(`Операция (соглашение): ${item ? item.title : formData.typicalAgreementOperation}`)
    }
    
    if (formData.typicalAgreementDepartment) fields.push(`Подразделение: ${formData.typicalAgreementDepartment}`)
    if (formData.typicalAgreementPeriodFrom) fields.push(`Период действия с: ${formData.typicalAgreementPeriodFrom}`)
    if (formData.typicalAgreementPeriodTo) fields.push(`Период действия по: Бессрочное`)
    else if (formData.typicalAgreementPeriodTo === false) fields.push(`Период действия по: Не указано`)
    
    if (formData.typicalAgreementCurrency) {
      const item = currencyOptions.value.find(item => item.CURRENCY === formData.typicalAgreementCurrency)
      fields.push(`Валюта: ${item ? item.FULL_NAME : formData.typicalAgreementCurrency}`)
    }
    
    if (formData.typicalAgreementSchedule) fields.push(`График: ${formData.typicalAgreementSchedule}`)
    if (formData.typicalAgreementAdditional) fields.push(`Дополнительно: ${formData.typicalAgreementAdditional}`)
  }
  
  // Поля для объекта "Индивидуальные соглашения" (17957)
  else if (formData.object === '17957') {
    fields.push('\n=== ДАННЫЕ ИНДИВИДУАЛЬНОГО СОГЛАШЕНИЯ ===')
    if (formData.individualAgreementBasis) fields.push(`Основание: ${formData.individualAgreementBasis}`)
    if (formData.individualAgreementName) fields.push(`Наименование: ${formData.individualAgreementName}`)
    if (formData.individualAgreementPartner) fields.push(`Партнер: ${formData.individualAgreementPartner}`)
    
    if (formData.individualAgreementOrganization) {
      const item = organizationOptions.value.find(item => item.id === formData.individualAgreementOrganization)
      fields.push(`Организация: ${item ? item.title : formData.individualAgreementOrganization}`)
    }
    
    if (formData.individualAgreementDate) fields.push(`Дата: ${formData.individualAgreementDate}`)
    if (formData.individualAgreementPeriodFrom) fields.push(`Период действия с: ${formData.individualAgreementPeriodFrom}`)
    if (formData.individualAgreementPeriodTo) fields.push(`Период действия по: Бессрочное`)
    else if (formData.individualAgreementPeriodTo === false) fields.push(`Период действия по: Не указано`)
    
    if (formData.individualAgreementNumber) fields.push(`Номер: ${formData.individualAgreementNumber}`)
    
    if (formData.individualAgreementOperation) {
      const item = agreementOperationOptions.value.find(item => item.id === formData.individualAgreementOperation)
      fields.push(`Операция (соглашение): ${item ? item.title : formData.individualAgreementOperation}`)
    }
    
    if (formData.individualAgreementType) {
      const item = agreementTypeOptions.value.find(item => item.id === formData.individualAgreementType)
      fields.push(`Тип соглашения: ${item ? item.title : formData.individualAgreementType}`)
    }
    
    if (formData.individualAgreementTypical) fields.push(`Типовое соглашение: ${formData.individualAgreementTypical}`)
    if (formData.individualAgreementPaymentSchedule) fields.push(`График оплаты: ${formData.individualAgreementPaymentSchedule}`)
    
    if (formData.individualAgreementCurrency) {
      const item = currencyOptions.value.find(item => item.CURRENCY === formData.individualAgreementCurrency)
      fields.push(`Валюта: ${item ? item.FULL_NAME : formData.individualAgreementCurrency}`)
    }
    
    if (formData.individualAgreementPricing) fields.push(`Ценообразование: ${formData.individualAgreementPricing}`)
    if (formData.individualAgreementAdditional) fields.push(`Дополнительно: ${formData.individualAgreementAdditional}`)
  }
  
  // Поля для объекта "Договоры" (16943)
  else if (formData.object === '16943') {
    fields.push('\n=== ДАННЫЕ ДОГОВОРА ===')
    
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
    
    if (formData.organization) {
      const item = organizationOptions.value.find(item => item.id === formData.organization)
      fields.push(`Организация: ${item ? item.title : formData.organization}`)
    }
    
    if (formData.organizationInn) fields.push(`Организация ИНН: ${formData.organizationInn}`)
    if (formData.organizationAccount) fields.push(`Счет организации: ${formData.organizationAccount}`)
    if (formData.counterparty) fields.push(`Контрагент: ${formData.counterparty}`)
    if (formData.counterpartyInn) fields.push(`Контрагент ИНН: ${formData.counterpartyInn}`)
    if (formData.partner) fields.push(`Партнер: ${formData.partner}`)
    
    if (formData.paymentDetails) {
      const item = paymentDetailsOptions.value.find(item => item.id === formData.paymentDetails)
      fields.push(`Детализация расчётов: ${item ? item.title : formData.paymentDetails}`)
    }
    
    if (formData.currency) {
      const item = currencyOptions.value.find(item => item.CURRENCY === formData.currency)
      fields.push(`Валюта: ${item ? item.FULL_NAME : formData.currency}`)
    }
    
    if (formData.foreignCurrencyPayment) fields.push(`Оплата в иностранной валюте: Да`)
    if (formData.fixedContractAmount) fields.push(`Сумма договора фиксирована: Да`)
    if (formData.allowSubsidiaryPartners) fields.push(`Разрешена работа с дочерними партнерами: Да`)
    
    if (formData.labeledProducts) {
      const item = labeledProductsOptions.value.find(item => item.id === formData.labeledProducts)
      fields.push(`Маркируемая продукция: ${item ? item.title : formData.labeledProducts}`)
    }
    
    if (formData.prohibitShipment) fields.push(`Запрещать отгрузку: Да`)
    if (formData.dontShipOnDebt) fields.push(`Не отгружать при сумме задолженности: Да`)
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
  }
  
  // Поля для объекта "Склады" (16945)
  else if (formData.object === '16945') {
    fields.push('\n=== ДАННЫЕ СКЛАДА ===')
    
    if (formData.warehouseType) {
      const item = warehouseTypeOptions.value.find(item => item.id === formData.warehouseType)
      fields.push(`Тип склада: ${item ? item.title : formData.warehouseType}`)
    }
    
    if (formData.warehouseGroup) fields.push(`Группа складов: ${formData.warehouseGroup}`)
    if (formData.warehouseName) fields.push(`Наименование склада: ${formData.warehouseName}`)
    
    if (formData.priceSource) {
      const item = priceSourceOptions.value.find(item => item.id === formData.priceSource)
      fields.push(`Источник информации о ценах: ${item ? item.title : formData.priceSource}`)
    }
    
    if (formData.accountingPriceType) fields.push(`Учетный вид цены: ${formData.accountingPriceType}`)
    if (formData.controlFreeBalance) fields.push(`Контролировать свободные остатки: Да`)
    if (formData.controlOperationalBalance) fields.push(`Контролировать оперативные остатки: Да`)
    if (formData.department) fields.push(`Подразделение: ${formData.department}`)
    if (formData.responsiblePerson) fields.push(`Ответственный (МОЛ): ${formData.responsiblePerson}`)
    
    if (formData.businessRegion) {
      const item = businessRegionOptions.value.find(item => item.id === formData.businessRegion)
      fields.push(`Бизнес-регион: ${item ? item.title : formData.businessRegion}`)
    }
    
    if (formData.orderScheme) fields.push(`Ордерная схема: Да`)
    if (formData.hasCells) fields.push(`Ячейки: Да`)
    if (formData.warehouseAddress) fields.push(`Адрес склада: ${formData.warehouseAddress}`)
    if (formData.warehousePhone) fields.push(`Телефон склада: ${formData.warehousePhone}`)
    if (formData.warehouseComment) fields.push(`Комментарий: ${formData.warehouseComment}`)
    if (formData.warehouseCode) fields.push(`Склад (код): ${formData.warehouseCode}`)
    if (formData.warehouseNameSecondary) fields.push(`Наименование склада (дополнительное): ${formData.warehouseNameSecondary}`)
  }
  
  // Поля для объекта "Упаковки" (16947)
  else if (formData.object === '16947') {
    fields.push('\n=== ДАННЫЕ УПАКОВКИ ===')
    if (formData.nomenclature) fields.push(`Номенклатура: ${formData.nomenclature}`)
    if (formData.nomenclatureCodes) fields.push(`Номенклатура (код): ${formData.nomenclatureCodes}`)
    if (formData.additionalInfo) fields.push(`Дополнительно: ${formData.additionalInfo}`)
    if (formData.measurementUnit) fields.push(`Единица измерения: ${formData.measurementUnit}`)
    if (formData.packageComposition) fields.push(`1 шт упаковки состоит из: ${formData.packageComposition}`)
    if (formData.weight) fields.push(`Вес: ${formData.weight} кг`)
    if (formData.height) fields.push(`Высота, м: ${formData.height}`)
    if (formData.width) fields.push(`Ширина, м: ${formData.width}`)
    if (formData.depth) fields.push(`Глубина, м: ${formData.depth}`)
    if (formData.volume) fields.push(`Объем: ${formData.volume}`)
    if (formData.packageName) fields.push(`Упаковка: ${formData.packageName}`)
  }
  
  // Поля для объекта "Скидки (наценки)" (16959)
  else if (formData.object === '16959') {
    fields.push('\n=== ДАННЫЕ СКИДКИ ===')
    if (formData.discountBasis) fields.push(`Основание: ${formData.discountBasis}`)
    if (formData.discountName) fields.push(`Наименование: ${formData.discountName}`)
    
    if (formData.discountType) {
      const item = discountTypeOptions.value.find(item => item.id === formData.discountType)
      fields.push(`Тип скидки: ${item ? item.title : formData.discountType}`)
    }
    
    if (formData.salesChannel) {
      const item = salesChannelOptions.value.find(item => item.id === formData.salesChannel)
      fields.push(`Канал продаж: ${item ? item.title : formData.salesChannel}`)
    }
    
    if (formData.discountPeriodFrom) fields.push(`Период действия с: ${formData.discountPeriodFrom}`)
    if (formData.discountPeriodTo) fields.push(`Период действия по: ${formData.discountPeriodTo}`)
    if (formData.discountSelections) fields.push(`Отборы (соглашения): ${formData.discountSelections}`)
    if (formData.discountMechanics) fields.push(`Механика и условия предоставления: ${formData.discountMechanics}`)
    if (formData.discountAdditional) fields.push(`Дополнительно: ${formData.discountAdditional}`)
  }
  
  // Поля для объекта "Цены (прайс-лист)" (16961)
  else if (formData.object === '16961') {
    fields.push('\n=== ДАННЫЕ ЦЕНЫ ===')
    if (formData.priceBasis) fields.push(`Основание: ${formData.priceBasis}`)
    if (formData.priceChangeReason) fields.push(`Причина изменения: ${formData.priceChangeReason}`)
    if (formData.pricePeriodFrom) fields.push(`Период действия с: ${formData.pricePeriodFrom}`)
    if (formData.pricePeriodTo) fields.push(`Период действия по: ${formData.pricePeriodTo}`)
    if (formData.priceDepartment) fields.push(`Подразделение: ${formData.priceDepartment}`)
    if (formData.priceAdditional) fields.push(`Дополнительно: ${formData.priceAdditional}`)
  }
  
  // Поля для объекта "Контрагент/Договор" (17961)
  else if (formData.object === '17961') {
    fields.push('\n=== ДАННЫЕ КОНТРАГЕНТА ===')
    fields.push(`Вид контрагента: ${getCounterpartyTypeTitle(formData.complexCounterpartyType)}`)
    if (formData.complexInn) fields.push(`ИНН: ${formData.complexInn}`)
    if (formData.complexName) fields.push(`Наименование: ${formData.complexName}`)
    if (formData.complexShortName) fields.push(`Сокр. наименование: ${formData.complexShortName}`)
    
    // Специфичные поля для ЮЛ и ОПЮЛ
    if (['17941', '17943'].includes(formData.complexCounterpartyType)) {
      if (formData.complexKpp) fields.push(`КПП: ${formData.complexKpp}`)
      if (formData.complexOgrn) fields.push(`ОГРН: ${formData.complexOgrn}`)
      if (formData.complexOkpo) fields.push(`ОКПО: ${formData.complexOkpo}`)
    }
    
    // Поля для ОПЮЛ
    if (formData.complexCounterpartyType === '17943') {
      if (formData.complexHeadInn) fields.push(`ИНН Головного контрагента: ${formData.complexHeadInn}`)
      if (formData.complexHeadCounterparty) fields.push(`Головной контрагент: ${formData.complexHeadCounterparty}`)
    }
    
    // Поле для ФЛ
    if (formData.complexCounterpartyType === '17945' && formData.complexIdentityDocument) {
      fields.push(`Документ удост. личность: ${formData.complexIdentityDocument}`)
    }
    
    // Поле для ИП
    if (formData.complexCounterpartyType === '17947' && formData.complexOgrnip) {
      fields.push(`ОГРНИП: ${formData.complexOgrnip}`)
    }
    
    // Поля для ЮЛН
    if (formData.complexCounterpartyType === '17949') {
      if (formData.complexRegistrationCountry) fields.push(`Страна регистрации: ${formData.complexRegistrationCountry}`)
      if (formData.complexRegistrationNumber) fields.push(`Рег. номер: ${formData.complexRegistrationNumber}`)
      if (formData.complexTaxNumber) fields.push(`Налоговый номер: ${formData.complexTaxNumber}`)
    }
    
    if (formData.complexLegalAddress) fields.push(`Юридический адрес: ${formData.complexLegalAddress}`)
    if (formData.complexActualAddress) fields.push(`Фактический адрес: ${formData.complexActualAddress}`)
    if (formData.complexPhone) fields.push(`Телефон: ${formData.complexPhone}`)
    if (formData.complexEmail) fields.push(`Электронная почта: ${formData.complexEmail}`)
    if (formData.complexContactPerson) fields.push(`Контактное лицо: ${formData.complexContactPerson}`)
    
    fields.push('\n=== ДАННЫЕ ДОГОВОРА ===')
    if (formData.complexContractPurpose) {
      const item = contractPurposeOptions.value.find(item => item.id === formData.complexContractPurpose)
      fields.push(`Цель договора: ${item ? item.title : formData.complexContractPurpose}`)
    }
    if (formData.complexContractNumber) fields.push(`Номер договора: ${formData.complexContractNumber}`)
    if (formData.complexContractDate) fields.push(`Дата договора: ${formData.complexContractDate}`)
    if (formData.complexContractPeriodFrom) fields.push(`Период действия с: ${formData.complexContractPeriodFrom}`)
    if (formData.complexContractPeriodTo) fields.push(`Период действия по: ${formData.complexContractPeriodTo}`)
    if (formData.complexContractName) fields.push(`Наименование договора: ${formData.complexContractName}`)
    if (formData.complexDepartment) fields.push(`Подразделение: ${formData.complexDepartment}`)
    
    if (formData.complexOrganization) {
      const item = organizationOptions.value.find(item => item.id === formData.complexOrganization)
      fields.push(`Организация: ${item ? item.title : formData.complexOrganization}`)
    }
    
    if (formData.complexOrganizationInn) fields.push(`Организация ИНН: ${formData.complexOrganizationInn}`)
    if (formData.complexOrganizationAccount) fields.push(`Счет организации: ${formData.complexOrganizationAccount}`)
    if (formData.complexPartner) fields.push(`Партнер: ${formData.complexPartner}`)
    
    if (formData.complexPaymentDetails) {
      const item = paymentDetailsOptions.value.find(item => item.id === formData.complexPaymentDetails)
      fields.push(`Детализация расчётов: ${item ? item.title : formData.complexPaymentDetails}`)
    }
    
    if (formData.complexCurrency) {
      const item = currencyOptions.value.find(item => item.CURRENCY === formData.complexCurrency)
      fields.push(`Валюта: ${item ? item.FULL_NAME : formData.complexCurrency}`)
    }
    
    if (formData.complexForeignCurrencyPayment) fields.push(`Оплата в иностранной валюте: Да`)
    if (formData.complexFixedContractAmount) fields.push(`Сумма договора фиксирована: Да`)
    if (formData.complexAllowSubsidiaryPartners) fields.push(`Разрешена работа с дочерними партнерами: Да`)
    
    if (formData.complexLabeledProducts) {
      const item = labeledProductsOptions.value.find(item => item.id === formData.complexLabeledProducts)
      fields.push(`Маркируемая продукция: ${item ? item.title : formData.complexLabeledProducts}`)
    }
    
    if (formData.complexProhibitShipment) fields.push(`Запрещать отгрузку: Да`)
    if (formData.complexDontShipOnDebt) fields.push(`Не отгружать при сумме задолженности: Да`)
    if (formData.complexDebtAmount) fields.push(`Сумма задолженности: ${formData.complexDebtAmount}`)
    
    if (formData.complexVatRate) {
      const item = vatRateOptions.value.find(item => item.id === formData.complexVatRate)
      fields.push(`Ставка НДС: ${item ? item.title : formData.complexVatRate}`)
    }
    
    if (formData.complexFinancialGroup) {
      const item = financialGroupOptions.value.find(item => item.id === formData.complexFinancialGroup)
      fields.push(`Группа фин. учета: ${item ? item.title : formData.complexFinancialGroup}`)
    }
    
    if (formData.complexDdsArticle) {
      const item = ddsArticleOptions.value.find(item => item.id === formData.complexDdsArticle)
      fields.push(`Статья ДДС: ${item ? item.title : formData.complexDdsArticle}`)
    }
    
    if (formData.complexDebtClassification) {
      const item = debtClassificationOptions.value.find(item => item.id === formData.complexDebtClassification)
      fields.push(`Классификация задолженности: ${item ? item.title : formData.complexDebtClassification}`)
    }
    
    if (formData.complexVatDeclarationOperation) {
      const item = vatDeclarationOperationOptions.value.find(item => item.id === formData.complexVatDeclarationOperation)
      fields.push(`Операция декларации по НДС: ${item ? item.title : formData.complexVatDeclarationOperation}`)
    }
  }
  
  // Поля для объекта "Партнер/Контрагент/Договор" (17959)
  else if (formData.object === '17959') {
    fields.push('\n=== ДАННЫЕ ПАРТНЕРА ===')
    fields.push(`Вид партнера: ${getPartnerTypeTitle(formData.combinedPartnerType)}`)
    
    if (formData.combinedPartnerName) fields.push(`Наименование: ${formData.combinedPartnerName}`)
    
    // Телефоны
    if (formData.combinedPhone) {
      fields.push(`Телефон: ${formData.combinedPhone}`)
    }
    if (formData.combinedAdditionalPhones && formData.combinedAdditionalPhones.length > 0) {
      formData.combinedAdditionalPhones.forEach((phone, index) => {
        if (phone) fields.push(`Телефон ${index + 2}: ${phone}`)
      })
    }
    
    // Emails
    if (formData.combinedEmail) {
      fields.push(`Электронная почта: ${formData.combinedEmail}`)
    }
    if (formData.combinedAdditionalEmails && formData.combinedAdditionalEmails.length > 0) {
      formData.combinedAdditionalEmails.forEach((email, index) => {
        if (email) fields.push(`Email ${index + 2}: ${email}`)
      })
    }
    
    if (formData.combinedBusinessRegion && formData.combinedBusinessRegion.length > 0) {
      const regions = formData.combinedBusinessRegion.map(id => {
        const item = businessRegionOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Бизнес-регион: ${regions}`)
    }
    
    if (formData.combinedRelationshipType && formData.combinedRelationshipType.length > 0) {
      const relationships = formData.combinedRelationshipType.map(id => {
        const item = relationshipTypeOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Тип отношений: ${relationships}`)
    }
    
    if (formData.combinedLegalAddress) fields.push(`Юридический адрес: ${formData.combinedLegalAddress}`)
    if (formData.combinedActualAddress) fields.push(`Фактический адрес: ${formData.combinedActualAddress}`)
    if (formData.combinedCopyAddress) fields.push(`Копировать адрес: Да`)
    
    if (formData.combinedCategoryB2) {
      const item = categoryB2Options.value.find(item => item.id === formData.combinedCategoryB2)
      fields.push(`Категория B2: ${item ? item.title : formData.combinedCategoryB2}`)
    }
    
    if (formData.combinedCategoryCA) {
      const item = categoryCAOptions.value.find(item => item.id === formData.combinedCategoryCA)
      fields.push(`Категория СА: ${item ? item.title : formData.combinedCategoryCA}`)
    }
    
    if (formData.combinedCkg) {
      const item = ckgOptions.value.find(item => item.id === formData.combinedCkg)
      fields.push(`ЦКГ: ${item ? item.title : formData.combinedCkg}`)
    }
    
    if (formData.combinedCkgB2B) {
      const item = ckgB2BOptions.value.find(item => item.id === formData.combinedCkgB2B)
      fields.push(`ЦКГ B2B: ${item ? item.title : formData.combinedCkgB2B}`)
    }
    
    // Данные контрагента для 17959
    if (formData.combinedCounterpartyType) {
      fields.push('\n=== ДАННЫЕ КОНТРАГЕНТА ===')
      fields.push(`Вид контрагента: ${getCounterpartyTypeTitle(formData.combinedCounterpartyType)}`)
      if (formData.combinedInn) fields.push(`ИНН: ${formData.combinedInn}`)
      if (formData.combinedCounterpartyName) fields.push(`Наименование: ${formData.combinedCounterpartyName}`)
      if (formData.combinedShortName) fields.push(`Сокр. наименование: ${formData.combinedShortName}`)
      
      if (['17941', '17943'].includes(formData.combinedCounterpartyType)) {
        if (formData.combinedKpp) fields.push(`КПП: ${formData.combinedKpp}`)
        if (formData.combinedOgrn) fields.push(`ОГРН: ${formData.combinedOgrn}`)
        if (formData.combinedOkpo) fields.push(`ОКПО: ${formData.combinedOkpo}`)
      }
      
      if (formData.combinedCounterpartyType === '17943') {
        if (formData.combinedHeadInn) fields.push(`ИНН Головного контрагента: ${formData.combinedHeadInn}`)
        if (formData.combinedHeadCounterparty) fields.push(`Головной контрагент: ${formData.combinedHeadCounterparty}`)
      }
      
      if (formData.combinedCounterpartyType === '17945' && formData.combinedIdentityDocument) {
        fields.push(`Документ удост. личность: ${formData.combinedIdentityDocument}`)
      }
      
      if (formData.combinedCounterpartyType === '17947' && formData.combinedOgrnip) {
        fields.push(`ОГРНИП: ${formData.combinedOgrnip}`)
      }
      
      if (formData.combinedCounterpartyType === '17949') {
        if (formData.combinedRegistrationCountry) fields.push(`Страна регистрации: ${formData.combinedRegistrationCountry}`)
        if (formData.combinedRegistrationNumber) fields.push(`Рег. номер: ${formData.combinedRegistrationNumber}`)
        if (formData.combinedTaxNumber) fields.push(`Налоговый номер: ${formData.combinedTaxNumber}`)
      }
      
      if (formData.combinedCounterpartyLegalAddress) fields.push(`Юридический адрес: ${formData.combinedCounterpartyLegalAddress}`)
      if (formData.combinedCounterpartyActualAddress) fields.push(`Фактический адрес: ${formData.combinedCounterpartyActualAddress}`)
      if (formData.combinedCounterpartyPhone) fields.push(`Телефон: ${formData.combinedCounterpartyPhone}`)
      if (formData.combinedCounterpartyEmail) fields.push(`Электронная почта: ${formData.combinedCounterpartyEmail}`)
      if (formData.combinedContactPerson) fields.push(`Контактное лицо: ${formData.combinedContactPerson}`)
    }
    
    // Данные договора для 17959
    if (formData.combinedContractPurpose) {
      fields.push('\n=== ДАННЫЕ ДОГОВОРА ===')
      
      const purposeItem = contractPurposeOptions.value.find(item => item.id === formData.combinedContractPurpose)
      fields.push(`Цель договора: ${purposeItem ? purposeItem.title : formData.combinedContractPurpose}`)
      
      if (formData.combinedContractNumber) fields.push(`Номер договора: ${formData.combinedContractNumber}`)
      if (formData.combinedContractDate) fields.push(`Дата договора: ${formData.combinedContractDate}`)
      if (formData.combinedContractPeriodFrom) fields.push(`Период действия с: ${formData.combinedContractPeriodFrom}`)
      if (formData.combinedContractPeriodTo) fields.push(`Период действия по: ${formData.combinedContractPeriodTo}`)
      if (formData.combinedContractName) fields.push(`Наименование договора: ${formData.combinedContractName}`)
      if (formData.combinedDepartment) fields.push(`Подразделение: ${formData.combinedDepartment}`)
      
      if (formData.combinedOrganization) {
        const orgItem = organizationOptions.value.find(item => item.id === formData.combinedOrganization)
        fields.push(`Организация: ${orgItem ? orgItem.title : formData.combinedOrganization}`)
      }
      
      if (formData.combinedOrganizationInn) fields.push(`Организация ИНН: ${formData.combinedOrganizationInn}`)
      if (formData.combinedOrganizationAccount) fields.push(`Счет организации: ${formData.combinedOrganizationAccount}`)
      
      if (formData.combinedPaymentDetails) {
        const paymentItem = paymentDetailsOptions.value.find(item => item.id === formData.combinedPaymentDetails)
        fields.push(`Детализация расчётов: ${paymentItem ? paymentItem.title : formData.combinedPaymentDetails}`)
      }
      
      if (formData.combinedCurrency) {
        const currencyItem = currencyOptions.value.find(item => item.CURRENCY === formData.combinedCurrency)
        fields.push(`Валюта: ${currencyItem ? currencyItem.FULL_NAME : formData.combinedCurrency}`)
      }
      
      if (formData.combinedForeignCurrencyPayment) fields.push(`Оплата в иностранной валюте: Да`)
      if (formData.combinedFixedContractAmount) fields.push(`Сумма договора фиксирована: Да`)
      if (formData.combinedAllowSubsidiaryPartners) fields.push(`Разрешена работа с дочерними партнерами: Да`)
      
      if (formData.combinedLabeledProducts) {
        const labeledItem = labeledProductsOptions.value.find(item => item.id === formData.combinedLabeledProducts)
        fields.push(`Маркируемая продукция: ${labeledItem ? labeledItem.title : formData.combinedLabeledProducts}`)
      }
      
      if (formData.combinedProhibitShipment) fields.push(`Запрещать отгрузку: Да`)
      if (formData.combinedDontShipOnDebt) fields.push(`Не отгружать при сумме задолженности: Да`)
      if (formData.combinedDebtAmount) fields.push(`Сумма задолженности: ${formData.combinedDebtAmount}`)
      
      if (formData.combinedVatRate) {
        const vatItem = vatRateOptions.value.find(item => item.id === formData.combinedVatRate)
        fields.push(`Ставка НДС: ${vatItem ? vatItem.title : formData.combinedVatRate}`)
      }
      
      if (formData.combinedFinancialGroup) {
        const financeItem = financialGroupOptions.value.find(item => item.id === formData.combinedFinancialGroup)
        fields.push(`Группа фин. учета: ${financeItem ? financeItem.title : formData.combinedFinancialGroup}`)
      }
      
      if (formData.combinedDdsArticle) {
        const ddsItem = ddsArticleOptions.value.find(item => item.id === formData.combinedDdsArticle)
        fields.push(`Статья ДДС: ${ddsItem ? ddsItem.title : formData.combinedDdsArticle}`)
      }
      
      if (formData.combinedDebtClassification) {
        const debtItem = debtClassificationOptions.value.find(item => item.id === formData.combinedDebtClassification)
        fields.push(`Классификация задолженности: ${debtItem ? debtItem.title : formData.combinedDebtClassification}`)
      }
      
      if (formData.combinedVatDeclarationOperation) {
        const vatOpItem = vatDeclarationOperationOptions.value.find(item => item.id === formData.combinedVatDeclarationOperation)
        fields.push(`Операция декларации по НДС: ${vatOpItem ? vatOpItem.title : formData.combinedVatDeclarationOperation}`)
      }
    }
  }
  
  // Поля для объекта "Партнер/Контрагент" (18003)
  else if (formData.object === '18003') {
    fields.push('\n=== ДАННЫЕ ПАРТНЕРА ===')
    fields.push(`Вид партнера: ${getPartnerTypeTitle(formData.partnerCounterpartyPartnerType)}`)
    
    if (formData.partnerCounterpartyName) fields.push(`Наименование: ${formData.partnerCounterpartyName}`)
    
    // Телефоны
    if (formData.partnerCounterpartyPhone) {
      fields.push(`Телефон: ${formData.partnerCounterpartyPhone}`)
    }
    if (formData.partnerCounterpartyAdditionalPhones && formData.partnerCounterpartyAdditionalPhones.length > 0) {
      formData.partnerCounterpartyAdditionalPhones.forEach((phone, index) => {
        if (phone) fields.push(`Телефон ${index + 2}: ${phone}`)
      })
    }
    
    // Emails
    if (formData.partnerCounterpartyEmail) {
      fields.push(`Электронная почта: ${formData.partnerCounterpartyEmail}`)
    }
    if (formData.partnerCounterpartyAdditionalEmails && formData.partnerCounterpartyAdditionalEmails.length > 0) {
      formData.partnerCounterpartyAdditionalEmails.forEach((email, index) => {
        if (email) fields.push(`Email ${index + 2}: ${email}`)
      })
    }
    
    if (formData.partnerCounterpartyBusinessRegion && formData.partnerCounterpartyBusinessRegion.length > 0) {
      const regions = formData.partnerCounterpartyBusinessRegion.map(id => {
        const item = businessRegionOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Бизнес-регион: ${regions}`)
    }
    
    if (formData.partnerCounterpartyRelationshipType && formData.partnerCounterpartyRelationshipType.length > 0) {
      const relationships = formData.partnerCounterpartyRelationshipType.map(id => {
        const item = relationshipTypeOptions.value.find(item => item.id === id)
        return item ? item.title : id
      }).join(', ')
      fields.push(`Тип отношений: ${relationships}`)
    }
    
    if (formData.partnerCounterpartyLegalAddress) fields.push(`Юридический адрес: ${formData.partnerCounterpartyLegalAddress}`)
    if (formData.partnerCounterpartyActualAddress) fields.push(`Фактический адрес: ${formData.partnerCounterpartyActualAddress}`)
    if (formData.partnerCounterpartyCopyAddress) fields.push(`Копировать адрес: Да`)
    
    if (formData.partnerCounterpartyCategoryB2) {
      const item = categoryB2Options.value.find(item => item.id === formData.partnerCounterpartyCategoryB2)
      fields.push(`Категория B2: ${item ? item.title : formData.partnerCounterpartyCategoryB2}`)
    }
    
    if (formData.partnerCounterpartyCategoryCA) {
      const item = categoryCAOptions.value.find(item => item.id === formData.partnerCounterpartyCategoryCA)
      fields.push(`Категория СА: ${item ? item.title : formData.partnerCounterpartyCategoryCA}`)
    }
    
    if (formData.partnerCounterpartyCkg) {
      const item = ckgOptions.value.find(item => item.id === formData.partnerCounterpartyCkg)
      fields.push(`ЦКГ: ${item ? item.title : formData.partnerCounterpartyCkg}`)
    }
    
    if (formData.partnerCounterpartyCkgB2B) {
      const item = ckgB2BOptions.value.find(item => item.id === formData.partnerCounterpartyCkgB2B)
      fields.push(`ЦКГ B2B: ${item ? item.title : formData.partnerCounterpartyCkgB2B}`)
    }
    
    // Данные контрагента для 18003
    if (formData.partnerCounterpartyCounterpartyType) {
      fields.push('\n=== ДАННЫЕ КОНТРАГЕНТА ===')
      fields.push(`Вид контрагента: ${getCounterpartyTypeTitle(formData.partnerCounterpartyCounterpartyType)}`)
      if (formData.partnerCounterpartyInn) fields.push(`ИНН: ${formData.partnerCounterpartyInn}`)
      if (formData.partnerCounterpartyCounterpartyName) fields.push(`Наименование: ${formData.partnerCounterpartyCounterpartyName}`)
      if (formData.partnerCounterpartyShortName) fields.push(`Сокр. наименование: ${formData.partnerCounterpartyShortName}`)
      
      if (['17941', '17943'].includes(formData.partnerCounterpartyCounterpartyType)) {
        if (formData.partnerCounterpartyKpp) fields.push(`КПП: ${formData.partnerCounterpartyKpp}`)
        if (formData.partnerCounterpartyOgrn) fields.push(`ОГРН: ${formData.partnerCounterpartyOgrn}`)
        if (formData.partnerCounterpartyOkpo) fields.push(`ОКПО: ${formData.partnerCounterpartyOkpo}`)
      }
      
      if (formData.partnerCounterpartyCounterpartyType === '17943') {
        if (formData.partnerCounterpartyHeadInn) fields.push(`ИНН Головного контрагента: ${formData.partnerCounterpartyHeadInn}`)
        if (formData.partnerCounterpartyHeadCounterparty) fields.push(`Головной контрагент: ${formData.partnerCounterpartyHeadCounterparty}`)
      }
      
      if (formData.partnerCounterpartyCounterpartyType === '17945' && formData.partnerCounterpartyIdentityDocument) {
        fields.push(`Документ удост. личность: ${formData.partnerCounterpartyIdentityDocument}`)
      }
      
      if (formData.partnerCounterpartyCounterpartyType === '17947' && formData.partnerCounterpartyOgrnip) {
        fields.push(`ОГРНИП: ${formData.partnerCounterpartyOgrnip}`)
      }
      
      if (formData.partnerCounterpartyCounterpartyType === '17949') {
        if (formData.partnerCounterpartyRegistrationCountry) fields.push(`Страна регистрации: ${formData.partnerCounterpartyRegistrationCountry}`)
        if (formData.partnerCounterpartyRegistrationNumber) fields.push(`Рег. номер: ${formData.partnerCounterpartyRegistrationNumber}`)
        if (formData.partnerCounterpartyTaxNumber) fields.push(`Налоговый номер: ${formData.partnerCounterpartyTaxNumber}`)
      }
      
      if (formData.partnerCounterpartyLegalAddress2) fields.push(`Юридический адрес: ${formData.partnerCounterpartyLegalAddress2}`)
      if (formData.partnerCounterpartyActualAddress2) fields.push(`Фактический адрес: ${formData.partnerCounterpartyActualAddress2}`)
      if (formData.partnerCounterpartyPhone2) fields.push(`Телефон: ${formData.partnerCounterpartyPhone2}`)
      if (formData.partnerCounterpartyEmail2) fields.push(`Электронная почта: ${formData.partnerCounterpartyEmail2}`)
      if (formData.partnerCounterpartyContactPerson) fields.push(`Контактное лицо: ${formData.partnerCounterpartyContactPerson}`)
    }
  }
  
  // Поля для ошибок/доработок (16935)
  if (formData.type === '16935' && formData.errorDescription) {
    fields.push('\n=== ОПИСАНИЕ ОШИБКИ ===')
    fields.push(`Описание ошибки: ${formData.errorDescription}`)
  }
  
  // Информация о файлах
  if (formData.hasFile && formData.hasFile.length > 0) {
    fields.push('\n=== ФАЙЛЫ ===')
    fields.push(`Количество файлов: ${formData.hasFile.length}`)
  }
  
  if (formData.typicalAgreementBasisFile && formData.typicalAgreementBasisFile.length > 0) {
    fields.push(`Файлы основания для типового соглашения: ${formData.typicalAgreementBasisFile.length}`)
  }
  
  if (formData.individualAgreementBasisFile && formData.individualAgreementBasisFile.length > 0) {
    fields.push(`Файлы основания для индивидуального соглашения: ${formData.individualAgreementBasisFile.length}`)
  }
  
  if (formData.discountBasisFile && formData.discountBasisFile.length > 0) {
    fields.push(`Файлы основания для скидки: ${formData.discountBasisFile.length}`)
  }
  
  if (formData.priceBasisFile && formData.priceBasisFile.length > 0) {
    fields.push(`Файлы основания для цены: ${formData.priceBasisFile.length}`)
  }
  
  if (formData.complexHasFile && formData.complexHasFile.length > 0) {
    fields.push(`Файлы для договора (17961): ${formData.complexHasFile.length}`)
  }
  
  if (formData.combinedHasFile && formData.combinedHasFile.length > 0) {
    fields.push(`Файлы для договора (17959): ${formData.combinedHasFile.length}`)
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
  try {
    await loadBitrixOptions()
    isLoading.value = false;
  } catch (error) {
    console.error('Ошибка загрузки:', error)
  }
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

// Правила валидации для файлов
const fileRules = [
  v => !v || v.length <= 10 || 'Максимально можно загрузить 10 файлов',
  v => {
    if (!v) return true
    const maxSize = 10 * 1024 * 1024 // 10 MB
    const oversizedFiles = v.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      return 'Каждый файл не должен превышать 10 МБ'
    }
    return true
  }
]

// Функция кодирования файлов в base64 для Bitrix
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

// Функция создания заявки в Bitrix24
const createBitrixRequest = async () => {
  return new Promise(async (resolve, reject) => {
    const fields = {
      entityTypeId: 1046,
      fields: {
        'ufCrm63_1765788575681': formData.type,
        'ufCrm63_1765789339357': formData.object,
        'ufCrm63_1765184971082': getAllRequestFields() || '',
      }
    }
    
    // Обработка файлов для всех типов заявок
    let files = []
    
    // Проверяем, есть ли файлы в поле hasFile
    if (formData.hasFile && formData.hasFile.length > 0) {
      files = await encodeFilesToBase64(formData.hasFile)
    }
    
    // Проверяем, есть ли файлы в complexHasFile для комплексных объектов
    if (formData.complexHasFile && formData.complexHasFile.length > 0) {
      const complexFiles = await encodeFilesToBase64(formData.complexHasFile)
      files = [...files, ...complexFiles]
    }
    
    // Добавляем файлы в поля запроса, если они есть
    if (files.length > 0) {
      // Преобразуем файлы в формат, который понимает Bitrix
      const bitrixFiles = files.map((file) => [file.name, file.base64])
      fields.fields['ufCrm63_1765184954446'] = bitrixFiles
    }
    
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

const hasAtLeastOneFieldFilled = (fieldsArray) => {
  return fieldsArray.some(field => {
    if (Array.isArray(field)) {
      return field.length > 0
    }
    return field !== null && field !== '' && field !== false
  })
}

// Основная функция отправки формы
const submitForm = async () => {
  // Для изменения и ошибок проверяем, что хотя бы одно поле заполнено
  if (isEditType.value || isErrorType.value) {
    const allFields = Object.values(formData).filter((value, key) => {
      // Исключаем системные поля
      const excludedKeys = ['date', 'type', 'object', 'comment', 'view']
      return !excludedKeys.includes(key)
    })
    
    if (!hasAtLeastOneFieldFilled(allFields)) {
      submitStatus.value = {
        type: 'error',
        message: 'Заполните хотя бы одно поле для изменения/доработки'
      }
      return
    }
  }
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
    const portalUrl = typeof BX24 !== 'undefined' 
      ? BX24.getDomain() 
      : window.location.origin;
    submitStatus.value = {
      type: 'success',
      itemId: itemId,
      requestUrl: `${portalUrl}/crm/type/1046/details/${itemId}/`,
      message: `создана и передана в обработку! Спасибо за обращение!`
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
  
  // Сброс всех полей
  Object.keys(formData).forEach(key => {
    if (key === 'date') {
      formData[key] = new Date().toLocaleDateString('ru-RU')
    } else if (Array.isArray(formData[key])) {
      formData[key] = []
    } else if (typeof formData[key] === 'boolean') {
      formData[key] = false
    } else {
      formData[key] = null
    }
  })
  
  currentStep.value = 1
  if (form.value) {
    form.value.resetValidation()
  }
}
</script>

<style>
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

.v-input__details {
  display: none !important;
}

.file {
  gap: 0.5rem;
  align-items: center;
}
</style>