<template lang="pug">
  ErrorLog(
        v-model:dialogStages="dialogStages"
        :dialogMsg="dialogMsg"
  )
  v-form(v-model="invoices")
        Filtres(
            :branchInfo="branchInfo"
            :paymentMethods="paymentMethods"
            v-model:showInput="showInput"
            ref="child"
        )
  v-btn(color="primary" @click="submit") Получить счета
</template>
  
<script>
// Функции
import { callApi } from '../../functions/callApi.ts'
import { formatItems } from '../../functions/formatItems.ts'

import { useMyStore } from '../../stores/store.js'; 
import { useGlobalStore } from '../../stores/store.js'; 
import { useParseStore } from '../../stores/store.js'; 

// Компоненты
import ErrorLog from './ErrorLog.vue';
import NumberInput from './Date/NumberInput.vue';
import DateFields from './Date/DateFields.vue';
import DatePickerPanel from './Date/DatePickerPanel.vue';
import Filtres from './Filtres.vue';


  export default {
    components: { ErrorLog, NumberInput, DateFields, DatePickerPanel, Filtres },
    props: {
      monthNames: {
        type: Array
      },
      invoices: {

      },
      isLoading: {
        default: false
      },
      branchInfo: {
        type: Array,
        required: true,
      },
      paymentMethods: {
        type: Array,
        required: true,
      },
      showInput: {
       
      },
      parse: {

      },
    },
    data() {
      const myStore = useMyStore();
      const parseStore = useParseStore();
      const globalStore = useGlobalStore();

      return {
        dateNames: ["Любая дата", "Сегодня", "Вчера", "Текущая неделя", "Текущий месяц", "Текущий квартал", "Текущий год", "Прошлая неделя", "Прошлый месяц", "Прошлый квартал", "Прошлый год", "Последние 7 дней", "Последние 30 дней", "Последние 60 дней", "Последние 90 дней", "Последние N дней", "Следующие 7 дней", "Следующие 30 дней", "Следующие 60 дней", "Следующие 90 дней", "Следующие N дней", "Следующая неделя", "Следующий месяц", "Следующий квартал", "Следующий год", "Месяц", "Квартал", "Год", "Точная дата", "Диапазон"],
        isLoading: this.isLoading,
        invoices: [],
        dialogStages: false,
        dialogMsg: null,
        showInput: [false, false, false, false, false, false],
        myStore,
        items: myStore.items,
        parseStore,
        filter: parseStore.items,
        globalStore,
        courses: globalStore.courses,
      };
    },
    methods: {
        checkError(){
        if (this.selectedDay) {
        this.dialogStages = true;
        this.dialogMsg = 'Выберите филиалы и способы оплаты';
        return true;
        }else if(this.showInput[5] && !this.selectedDay){
        this.dialogStages = true;
        this.dialogMsg = 'Выберите дату';
        return true;
        }else if(this.showInput[4]){
        if(!this.selectedRange[0] || !this.selectedRange[1]){
            this.dialogStages = true;
            this.dialogMsg = 'Выберите дату';
            return true;
        }
        }
        },
        async submit(){
            this.$refs.child.submit();

       //try {

        if(this.checkError()){
            return;
        }

        this.isLoading = true;
        this.parseStore.setSelect(["closedate", "ufCrm_SMART_INVOICE_1729670614381", "ufCrm_SMART_INVOICE_1730028921271", "opportunity", "currencyId"]);

        let invoices;
        let totalOpportunity;
        let total;

          this.myStore.clearItems();
          this.parseStore.deleteParsedBatches();
        [invoices, total, this.parseStore.parsed] = await callApi("crm.item.list", this.parseStore.filter, this.parseStore.select, 31, 0, 0);
        this.parseStore.addParsedBatches(0);
        this.parseStore.setTotal(total);
        [this.invoices, totalOpportunity] = formatItems(invoices.items, this.caller, this.branchInfo, this.paymentMethods, this.courses, 0);
        this.myStore.setTotalOpportunity(totalOpportunity);

        for (let i = 0; i < this.invoices.length; i++) {
          this.myStore.setItemAtIndex(this.invoices[i], i);
        }

        this.isLoading = false;
        return invoices;
        //} catch {
          this.dialogStages = true;
          this.dialogMsg = 'Ошибка во время выполнения';
          this.isLoading = false;
        //} finally {
          this.isLoading = false;
        //}
        },
    },
    mounted() {

    },
  };
  </script>

<style lang="sass" scoped>

  .v-form
      width: 100%
      display: grid
      grid-template-columns: 1fr 1fr
      gap: 0.75rem

  .v-form .v-input
    width: 45%

  .inputs
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr))
    column-gap: 1rem
    padding: 0
</style>