import { LightningElement, track, wire, api } from 'lwc';
import getLeads from '@salesforce/apex/LeadSearchController.getLeads';
import getLeadsGroupedResult from '@salesforce/apex/LeadSearchController.getLeadsGroupedResult';

const ACTIONS = [];
    ACTIONS.push({label: 'View', name: 'view', iconName:'utility:preview'});

const COLUMNS = [];
    COLUMNS.push({type: 'action', typeAttributes: {rowActions:ACTIONS}});
    COLUMNS.push({ label: 'Company', sortable:true, initialWidth:180, type:'url', fieldName: 'IdLink', typeAttributes: {label: { fieldName: 'Company' }, target: '_self'} });
    COLUMNS.push({ label: 'Name', fieldName: 'FullName', type: 'String',});
    COLUMNS.push({ label: 'Email', sortable:true,  initialWidth:180, fieldName: 'Email',  type: 'String', cellAttributes: { class: { fieldName: 'DomainStyle' }}});
    COLUMNS.push({ label: 'Website', initialWidth:150, sortable:true,  editable:true,  fieldName: 'Website', type: 'string',});
    COLUMNS.push({ label: 'Phone', initialWidth:150, fieldName: 'Phone', type: 'phone',});
    COLUMNS.push({ label: 'Owner', sortable:true, iconName:'standard:lead', fieldName: 'OwnerAlias', type: 'String',});
    COLUMNS.push({ label: 'Created Date', sortable:true, iconName:'standard:lead', fieldName: 'CreatedDate', type: 'date', });
    COLUMNS.push({ label: 'Source', sortable:true,  iconName:'standard:lead', fieldName: 'LeadSource', type: 'String',});

export default class LeadSearch extends LightningElement {
    @track rows = [];
    @track columns = COLUMNS;
    recordCount;
    sortedBy;
    sortedDirection;
    lastCreatedDate;
    lastId;
    tempLastCreatedDate;
    tempLastId;
    leadSource = '';
    /* geLead */
    @track ownerAlias;
    @track status;
    @track searchTerm = '';
    @track groupBy = 'LeadSource';
    groupedData;
    groupedTotal;

    /* modal */
    recordId;
    recordIds;
    objectApiName;
    fields;
    isLoading;

    draftValues = [];
    selectedRows = [];

    stringSet = {
        lastId: null,
        division: '',
        ownerAlias: '',
        status: '',
        leadSource: '',
    }
    
    dateSet = {
        lastCreatedDate:  null,
    }

    async loadmoreData(event) {
        if (this.rows.length < 50) {
            return; // the datatable frame is too short, so it will keep rendering loadmore unless to stop by return here
        }
        const { target } = event;
        target.isLoading = true;
        this.dateSet.lastCreatedDate = this.tempLastCreatedDate;
        this.stringSet.lastId = this.tempLastId;
        try {
            await this.loadData(); 
            target.isLoading = false;
        } catch (error) {
            console.error(error);
        }
    }

    loadData() {
        return new Promise((resolve, reject) => {
            getLeads({searchTerm: this.searchTerm, stringSet: this.stringSet, dateSet: this.dateSet })
            .then(data => {
    
                if (data.length) {
                    const mappedData = this.mapData(data);
                    this.rows = (this.rows || []).concat(mappedData); // concatenate mapped data
                }
                resolve();
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => {
                if (this.rows && this.rows.length > 1) {
                    this.tempLastCreatedDate = this.rows[this.rows.length - 1].CreatedDate;
                    this.tempLastId = this.rows[this.rows.length - 1].Id;
                } else {
                    this.tempLastCreatedDate = new Date();
                    this.tempLastId = null;
                }
            });
        });
    }

    connectedCallback() {
        this.loadConnectedData();
        this.loadGroupedData();
    }

    loadConnectedData() {
        return new Promise((resolve, reject) => {
            getLeads({searchTerm: this.searchTerm, stringSet: this.stringSet, dateSet: this.dateSet })
            .then(data => {
                if (data.length) {
                    const mappedData = this.mapData(data);
                    this.rows = (this.rows || []).concat(mappedData); // concatenate mapped data
                    this.tempLastCreatedDate = this.rows[this.rows.length - 1].CreatedDate;
                    this.tempLastId = this.rows[this.rows.length - 1].Id;
                }
                resolve();
            })
            .catch(error => {
                console.error(error);
            })
        });
    }

    loadGroupedData() {
        return new Promise((resolve, reject) => {
            getLeadsGroupedResult({groupBy: this.groupBy})
            .then(data => {
                let groupedData = data && data.length ? data.map(item => {
                    if (item[this.groupBy] === undefined) {
                        return {...item, [this.groupBy]: '', [this.groupBy + 'Name']: '---'};
                    } else {
                        return {...item, [this.groupBy + 'Name']: item[this.groupBy]};
                    }
                }) : [];

                // Sort the groupedData array
                groupedData = groupedData.sort((a, b) => {
                    if (a[this.groupBy] === '' && b[this.groupBy] !== '') {
                        return 1;
                    } else if (a[this.groupBy] !== '' && b[this.groupBy] === '') {
                        return -1;
                    } else {
                        return 0;
                    }
                });

                this.groupedData = groupedData;
                const groupedTotal = groupedData.reduce((current, next) => current + next.cnt, 0);
    
                resolve(data);
            })
            .catch(error => {
                console.error(error);
            })
        });
    }

    mapData(result) {
        const exceptions = ['hotmail', 'gmail', 'yahoo', 'aol', 'outlook', 'icloud', 'me', 'qq', 'msn', 'live', 'mac', 'comcast', 'verizon', 'att', 'googlemail', 'ymail', 'zoho', 'inbox', 'gmx', 'mail', 'protonmail']; // exclude non-company email domain
        const mappedResult = result.map(row => {
            let fullName = /^[a-z0-9]+$/i.test(row.FirstName + row.LastName) ? (row.FirstName ? row.FirstName + ' ' + row.LastName : row.LastName) : (row.LastName ? row.LastName + ' ' + row.FirstName : row.FirstName);
            let shortenUrl = row.Website ? row.Website.replace('https://', '') : '';
            let domainName = row.Email ? row.Email.split('@')[1].split('.')[0] : '';
            let domainStyle = exceptions.includes(domainName) ? 'slds-theme_shade' : '';
            return {
                Id                      : row.Id,
                IdLink                  : '/' + row.Id,
                Company                 : row.Company,
                FullName                : fullName,
                Email                   : row.Email,
                Phone                   : row.Phone,
                Website                 : shortenUrl,
                LeadSource              : row.LeadSource,
                OwnerId                 : row.OwnerId,
                OwnerAlias              : row.Owner.Alias,
                CreatedDate             : row.CreatedDate,
                CreatedBy               : row.CreatedBy.Alias,
                DomainStyle             : domainStyle,
            };
        });
        return mappedResult;
    }
    
    handleOwnerChange(event) {
        this.isLoading = true;
        const targetValue = event.target.value;
        if (this.stringSet.ownerAlias !== targetValue || targetValue === '') {
            this.initializeSearch();
        }
        this.stringSet.ownerAlias = targetValue;
        this.loadData();
        this.loadAggregatedResult();
        this.isLoading = false;
    }

    handleSearchTermChange(event) {
        this.isLoading = true;
        const targetValue = event.target.value;
        if (this.searchTerm !== targetValue || targetValue ==='') {
            this.initializeSearch();
        }
        this.searchTerm = targetValue;
        this.loadData();
        this.loadAggregatedResult();
        this.isLoading = false;
    }

    initializeSearch() {
        this.rows = [];
        this.dateSet.lastCreatedDate = null;
        this.stringSet.lastId = null;
    }

    onCloseModal() {
        this.showModal = false;
    }

    /* Searchable Combobox */
    @track isOpen = false;
    @track filteredData = [];

    handleInput(event) {
        const searchKeyDirect = event.target.value;
        if (searchKeyDirect === '') {
            this.leadSource = '';
            this.stringSet.leadSource = '';
            this.filteredData = [...this.groupedData];
            this.initializeSearch();
            this.loadData();
            return;
        }
        const searchKey = event.target.value.toLowerCase();
        this.filteredData = this.groupedData.filter(group => {
            return (group.LeadSource || '').toLowerCase().includes(searchKey);
        });
        this.leadSource = searchKeyDirect;
        this.isOpen = true;
    }

    async handleSelect(event) {
        this.isLoading = true;
        const selectedLeadSource = event.currentTarget.dataset.id;
        this.leadSource = selectedLeadSource ? selectedLeadSource : '';
        this.stringSet.leadSource = selectedLeadSource ? selectedLeadSource : '';
        this.initializeSearch();
        await this.loadData();
        this.loadAggregatedResult();
        this.isLoading = false;
        this.isOpen = false;
    }

    handleFocus() {
        this.filteredData = [...this.groupedData];
        this.isOpen = true;
    }

    handleBlur() {
        setTimeout(() => {
            this.isOpen = false;
        }, 100);
    }

    get comboboxClasses() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.isOpen ? 'slds-is-open' : ''}`;
    }
}