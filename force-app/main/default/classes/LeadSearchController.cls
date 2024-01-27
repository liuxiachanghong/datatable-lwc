public with sharing class LeadSearchController {
    @AuraEnabled
    public static List<Lead> getLeads(String searchTerm, Map<String, String> stringSet, Map<String, DateTime> dateSet) {
        DateTime lastCreatedDate = dateSet.get('lastCreatedDate');
        String lastId = stringSet.get('lastId');
        String ownerAlias = stringSet.get('ownerAlias');
        String status = stringSet.get('status');     
        String leadSource = stringSet.get('leadSource');     
        String query = 'SELECT Id, Company, LastName, FirstName, Email, Phone, Status, LeadSource, Website, Industry, OwnerId, Owner.Alias, CreatedDate, CreatedBy.Alias, (SELECT Id, Type, OwnerDivision__c, Owner.Alias FROM Cases__r), (SELECT Id, CreatedDate, Type, CreatedById FROM Tasks ORDER BY CreatedDate DESC LIMIT 10) FROM Lead';    
        List<String> conditions = new List<String>();
        conditions.add('Status != \'Unqualified\'');
        conditions.add('IsConverted = false');
        if (lastCreatedDate != null && String.isNotBlank(lastId)) {
            conditions.add('(CreatedDate < :lastCreatedDate OR (CreatedDate = :lastCreatedDate AND Id < :lastId))');
        }
        if (String.isNotBlank(ownerAlias)) {
            conditions.add('Owner.Alias = :ownerAlias');
        }
        if (String.isNotBlank(leadSource)) {
            conditions.add('LeadSource = :leadSource');
        } 
        if (String.isNotBlank(searchTerm)) {
            String keyword = '%' + searchTerm + '%';
            conditions.add('(Company LIKE :keyword OR Email LIKE :keyword OR LastName LIKE :keyword OR FirstName LIKE :keyword)');
        }    
        if (!conditions.isEmpty()) {
            query += ' WHERE ' + String.join(conditions, ' AND ');
        }
        
        query += ' ORDER BY CreatedDate DESC, Id DESC LIMIT 50';
        system.debug(query);
        return Database.query(query);
    }

    @AuraEnabled
    public static List<AggregateResult> getLeadsGroupedResult(String groupBy) {
        String query = 'SELECT COUNT(Id)cnt, ' + string.escapeSingleQuotes(groupBy) + ' FROM Lead';
        query += ' WHERE Status != \'Unqualified\' AND IsConverted = false';
        query += ' GROUP BY ' + groupBy;
        query += ' ORDER BY COUNT(Id) DESC';
        return Database.query(query);
    }

    @AuraEnabled
    public static void updateLeads(List<Lead> leads){
        update leads;
    }

    @AuraEnabled
    public static void deleteLeads(List<Lead> leads){
        delete leads;
    } 
}