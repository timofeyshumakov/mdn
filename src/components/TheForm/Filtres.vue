<template lang="pug">
    v-autocomplete(
        v-model="selectedBranches"
        @update:modelValue="updateSelectedBranches"
        :items="branchInfo"
        label="Выберите филиалы"
        id="branchesSelect"
        @click:clear="clearBranches"
        item-title="VALUE"
        item-value="ID"
        multiple
        chips
        clearable
    )
        template(v-slot:prepend-item)
          v-list-item
            v-list-item-content
              v-list-item-title
                v-checkbox(label="Все" :modelValue="selectAllBranches" @change="toggleSelectAllBranches")
    v-autocomplete(
        v-model="selectedPaymentMethods"
        @update:modelValue="updateSelectedPaymentMethods"
        :items="paymentMethods"
        label="Выберите способы оплаты"
        id="paymentMethodsSelect"
        @click:clear="clearPaymentMethods"
        item-title="VALUE"
        item-value="ID"
        multiple
        chips
        clearable
      )
        template(v-slot:prepend-item)
          v-list-item
            v-list-item-content
              v-list-item-title
                v-checkbox(label="Все" :modelValue="selectAllPaymentMethods" @change="toggleSelectAllPaymentMethods")
    Date(
        :showInput="showInput"
        :selectedDateIso="selectedDateIso"
    )

</template>

<script lang="js">
import Date from './Date/Date.vue';
import { useParseStore } from '../../stores/store.js'; 
import { useMyStore } from '../../stores/store.js'; 

export default {
    components: { Date },
    props: {
        branchInfo: {},
        selectedPaymentMethods: {},
        paymentMethods: {},
        selectedDateIso: {},
    },
    data() {
        const myStore = useMyStore();
        const parseStore = useParseStore();
        return {
            showInput: [false, false, false, false, false, false],
            selectedBranches: [],
            selectedPaymentMethods: [],
            selectAllBranches: false,
            branchInfo: this.branchInfo,
            branchIds: [],
            selectAllPaymentMethods: false,
            paymentMethods: this.paymentMethods,
            selectedDateIso: [null, null],
            parseStore,
            myStore,
            invoices: myStore,
        }
    },
    computed: {

    },
    methods: {
        submit(){
            console.log(this.selectedBranches);
            this.parseStore.setFilter(">closedate", this.selectedDateIso[0]);
            this.parseStore.setFilter("<closedate", this.selectedDateIso[1]);
            this.parseStore.setFilter("stageId", "DT31_1:P");
            this.parseStore.setFilter("ufCrm_SMART_INVOICE_1729670614381", this.selectedBranches);
            this.parseStore.setFilter("ufCrm_SMART_INVOICE_1730028921271", this.selectedPaymentMethods);
        },

        toggleSelectAllPaymentMethods() {

            if(this.selectAllPaymentMethods){
                this.selectAllPaymentMethods = false;
                this.selectedPaymentMethods = [];
            }else{
                this.selectedPaymentMethods = this.paymentMethodsIds;
                this.selectAllPaymentMethods = true;
                console.log(this.paymentMethodsIds);
            }
        },
        clearPaymentMethods() {
            this.selectAllPaymentMethods = false;
        },
        toggleSelectAllBranches() {
            if(this.selectAllBranches){
                this.selectAllBranches = false;
                this.selectedBranches = [];
            }else{
                this.selectAllBranches = true;
                this.selectedBranches = this.branchIds;
            }
            //
        },
        clearBranches() {
            this.selectAllBranches = false;
        },
        
    },
    watch: {
        selectedBranches(value){
            console.log(value);
            this.$emit('update:selectedBranches', value);
        },
        selectedPaymentMethods(value){
            this.$emit('update:selectedPaymentMethods', value);
        }
    },
    mounted() {
        this.branchInfo.push({"ID": "", "VALUE": "Не указан"});
        this.branchIds = this.branchInfo.map(obj => obj.ID);
        this.paymentMethods.push({"ID": "", "VALUE": "Не указан"});
        this.paymentMethodsIds = this.paymentMethods.map(obj => obj.ID);
    }
}
</script>