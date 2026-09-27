(() => {
  'use strict';
  const GROUPS = ['conversations', 'messages', 'drafts', 'customerSummaries', 'cannedResponses', 'knowledgeArticles'];
  window.TitanChatbotLocalSearch = {
    async search(query, { groups = GROUPS, limitPerGroup = 20 } = {}) {
      const output = {};
      await Promise.all(groups.map(async group => {
        const repository = window.TitanChatbotRepositories?.[group];
        output[group] = repository ? await repository.search(query, limitPerGroup) : [];
      }));
      window.dispatchEvent(new CustomEvent('chatbot:local-search-complete', { detail: { query, results: output } }));
      return output;
    }
  };
})();
