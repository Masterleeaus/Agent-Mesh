(function(g){'use strict';
const M=g.CodeeManagerCatalog||[];g.CodeeWorkforceProfiles=Object.freeze(M.map(m=>({id:`profile-${m.id}`,name:m.name,managerId:m.id,systemRole:m.role,preferredSkills:m.tags,authority:{advancePlan:false,directMutation:false}})));})(globalThis);
