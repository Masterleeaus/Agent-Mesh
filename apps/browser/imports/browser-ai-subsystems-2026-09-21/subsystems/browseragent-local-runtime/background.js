// Remove the import and use a bundled version of base64-js functions
const base64js = {
    toByteArray(base64String) {
        const binString = atob(base64String);
        return Uint8Array.from(binString, (m) => m.codePointAt(0));
    }
};

// Toggle side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Generate a unique extension ID if not already present
function getOrCreateExtensionId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['extensionId'], function(result) {
      if (result.extensionId) {
        resolve(result.extensionId);
      } else {
        // Generate a new UUID v4
        const extensionId = crypto.randomUUID();
        chrome.storage.local.set({ extensionId }, function() {
          resolve(extensionId);
        });
      }
    });
  });
}

// Add a logging system for workflow execution
let executionLogs = [];
let executionTime = undefined;

// Helper function to add a log entry
function addExecutionLog(entry) {
  const timestamp = new Date().toISOString();
  
  // Format the entry to match the app logs
  const formattedEntry = {
    timestamp,
    ...entry
  };
  
  // Check if this is a duplicate log (same type, nodeName, and similar timestamp)
  // Only keep the one with output data if it exists
  if (entry.type === 'complete' && entry.nodeName) {
    // Find recent logs for the same node
    const recentLogs = executionLogs.filter(log => 
      log.type === 'complete' && 
      log.nodeName === entry.nodeName &&
      // Check if logs are within 1 second of each other
      Math.abs(new Date(log.timestamp).getTime() - new Date(timestamp).getTime()) < 1000
    );
    
    if (recentLogs.length > 0) {
      // If we already have a log and the new one has output data, replace the old one
      if (entry.data?.output) {
        // Remove the old log(s)
        executionLogs = executionLogs.filter(log => !recentLogs.includes(log));
      } else {
        // If the new log doesn't have output data but old one does, skip this log
        const hasExistingOutputLog = recentLogs.some(log => log.data?.output);
        if (hasExistingOutputLog) {
          return; // Skip this log
        }
      }
    }
  }
  
  executionLogs.push(formattedEntry);
  
  // Keep only the last 1000 logs to prevent memory issues
  if (executionLogs.length > 1000) {
    executionLogs.shift();
  }
  
  // Broadcast log update
  chrome.runtime.sendMessage({ 
    action: 'logsUpdated', 
    logs: executionLogs,
    executionTime
  });
}

// Clear logs
function clearExecutionLogs() {
  executionLogs = [];
  executionTime = undefined;
  chrome.runtime.sendMessage({ 
    action: 'logsUpdated', 
    logs: executionLogs,
    executionTime 
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Modify the security check to allow extension pages and localhost for testing
  // DEVELOPMENT: Added localhost:3000 to allowed origins for testing
  if (sender.url && !sender.url.startsWith('https://app.browseragent.dev') && 
      !sender.url.startsWith('chrome-extension://') &&
      !sender.url.startsWith('https://dev.browserai.dev')) {
    console.error('Invalid sender origin:', sender.url);
    return;
  }

  console.log('Received message:', message);
  if (message.action === 'openSidePanel') {
    console.log('Opening side panel');
    chrome.sidePanel.open({ windowId: sender.tab.windowId });
  }
  if (message.action === 'refreshWorkflows') {
    // Get or create extension ID before opening the sync tab
    getOrCreateExtensionId().then(extensionId => {
      // Add extension ID as a query parameter
      // Determine which URL to use - this will also determine environment
      let syncUrl;
      
      // UNCOMMENT ONE OF THESE FOR YOUR ENVIRONMENT
      syncUrl = new URL("https://app.browseragent.dev/dashboard/chrome-extension"); // PROD
      // syncUrl = new URL("https://dev.browserai.dev/dashboard/chrome-extension"); // DEV
      // syncUrl = new URL("http://localhost:3000/dashboard/chrome-extension"); // LOCAL DEV
      
      // Set environment based on the URL
      let environment = 'dev'; // Default to dev
      if (syncUrl.hostname === 'app.browseragent.dev') {
        environment = 'prod';
      }
      
      // Store the environment in local storage
      chrome.storage.local.set({ environment }, () => {
        console.log(`Environment set to: ${environment} based on sync URL: ${syncUrl.hostname}`);
      });
      
      // Add the extension_id parameter
      syncUrl.searchParams.append("extension_id", extensionId);
      
      console.log('Opening sync tab with URL:', syncUrl.toString());
      
      chrome.tabs.create({ url: syncUrl.toString(), active: true});
      sendResponse({ status: "opening sync tab", extensionId, environment });
    });
    return true;
  }
  if (message.action === 'workflowDataReceived') {
    console.log('Processing workflow data:', message.data);
    const data = message.data;
    
    // Add a check to see if this is a valid sync or just a check
    if (data.skipSync === true) {
      console.log('Skipping sync as requested');
      return;
    }
    
    if (!data.encryptedWorkflowData) {
        console.error("No workflow data received");
        return;
    }

    const encryptedDataB64 = data.encryptedWorkflowData;
    const encryptionKeyB64 = data.encryptionKey;
    const ivB64 = data.iv;
    const expiryTimestamp = data.expiryTimestamp;

    // Convert base64 strings to byte arrays
    const encryptionKeyRaw = Uint8Array.from(atob(encryptionKeyB64), c => c.charCodeAt(0));
    const encryptedDataRaw = Uint8Array.from(atob(encryptedDataB64), c => c.charCodeAt(0));
    const ivRaw = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));

    crypto.subtle.importKey("raw", encryptionKeyRaw, { name: "AES-CBC", length: 256 }, false, ["decrypt"])
        .then(key => crypto.subtle.decrypt({ name: "AES-CBC", iv: ivRaw }, key, encryptedDataRaw))
        .then(decryptedData => {
            const decoder = new TextDecoder();
            const workflowData = JSON.parse(decoder.decode(decryptedData));
            
            // Store the complete workflow data including content
            chrome.storage.local.set({
                workflowsData: workflowData.workflows.reduce((acc, workflow) => {
                    acc[workflow.id] = workflow;
                    return acc;
                }, {}),
                workflowsList: workflowData.workflows.map(({ id, name, description, type, updated_on }) => ({
                    id, name, description, type, updated_on
                })),
                encryptionKey: encryptionKeyB64,
                expiryTimestamp: expiryTimestamp
            }, () => {
                chrome.runtime.sendMessage({ 
                    action: 'workflowsUpdated', 
                    workflows: workflowData.workflows.map(({ id, name, description, type, updated_on }) => ({
                        id, name, description, type, updated_on
                    }))
                });
                chrome.tabs.remove(sender.tab.id);
            });
        })
        .catch(error => {
            console.error("Decryption or storage failed:", error);
            chrome.tabs.remove(sender.tab.id);
        });

    // Clear sensitive data after expiry
    const clearData = () => {
      chrome.storage.local.remove([
        'workflowsData',
        'encryptionKey',
        'expiryTimestamp'
      ]);
    };
    
    setTimeout(clearData, expiryTimestamp - Date.now());
  }

  // Add a handler for getting specific workflow data
  if (message.action === 'getWorkflowData') {
    console.log('Background: Received getWorkflowData request for ID:', message.workflowId);
    chrome.storage.local.get(['workflowsData'], function(result) {
      console.log('Background: Current workflowsData:', result.workflowsData);
      const workflowData = result.workflowsData?.[message.workflowId];
      console.log('Background: Found workflow data:', workflowData);
      sendResponse({ workflowData });
    });
    return true;
  }

  // Add a handler for editing workflow
  if (message.action === 'editWorkflow') {
    console.log('Background: Opening workflow editor for ID:', message.workflowId);
    if (!message.workflowId) {
      console.error('No workflow ID provided for editing');
      sendResponse({ success: false, error: 'No workflow ID provided' });
      return true;
    }
    
    // Use the same localhost URL format as in the refreshWorkflows handler
    const editUrl = `https://app.browseragent.dev/dashboard/workflow/${message.workflowId}`;
    // const editUrl = `http://localhost:3000/dashboard/workflow/${message.workflowId}`;
    console.log('Opening edit URL:', editUrl);
    
    // Open in a new tab
    chrome.tabs.create({ url: editUrl, active: true });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getWorkflows') {
    console.log('Background: Received getWorkflows request');
    chrome.storage.local.get(['workflowsList', 'expiryTimestamp'], function(result) {
      console.log('Background: Current workflowsList:', result.workflowsList);
      const now = Date.now();
      if (result.expiryTimestamp && now > result.expiryTimestamp) {
        chrome.storage.local.remove(['workflowsList', 'workflowsData', 'encryptionKey', 'expiryTimestamp']);
        sendResponse({ workflows: [] });
      } else {
        sendResponse({ workflows: result.workflowsList || [] });
      }
    });
    return true;
  }

  // Listen for action execution requests
  if (message.action === 'executeAction') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Request permission to execute script in the tab if needed
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: 'executeAction',
            type: message.type,
            params: message.params
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // If content script is not loaded, inject it first
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['content-script.js']
              }, () => {
                // Retry sending the message after script injection
                chrome.tabs.sendMessage(
                  tabs[0].id,
                  {
                    action: 'executeAction',
                    type: message.type,
                    params: message.params
                  },
                  sendResponse
                );
              });
            } else {
              sendResponse(response);
            }
          }
        );
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
     
    return true; // Required for async sendResponse
  }

  if (message.action === 'getExecutionLogs') {
    console.log('Sending execution logs:', executionLogs.length, 'entries', 'Execution time:', executionTime);
    sendResponse({ logs: executionLogs, executionTime });
    return true;
  }

  if (message.action === 'clearExecutionLogs') {
    console.log('Clearing execution logs');
    clearExecutionLogs();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'addExecutionLog') {
    console.log('Adding execution log:', message.logEntry, 'Execution time:', message.executionTime);
    addExecutionLog(message.logEntry);
    // Update execution time if provided
    if (message.executionTime !== undefined) {
      executionTime = message.executionTime;
      console.log('Updated execution time to:', executionTime);
    }
    sendResponse({ success: true });
    return true;
  }

  // Add a handler for stopping workflow execution 
  if (message.action === 'stopExecution') {
    console.log('Background: Stopping workflow execution');
    
    // Add a log entry for cancellation
    addExecutionLog({
      type: 'error',
      message: 'Workflow execution stopped by user'
    });
    
    // Broadcast a special message to all tabs to cancel execution
    chrome.runtime.sendMessage({ 
      action: 'executionCancelled'
    });
    
    sendResponse({ success: true });
    return true;
  }
});

// Toggle side panel when command is triggered
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-side-panel') {
    chrome.windows.getCurrent().then(window => {
      chrome.sidePanel.open({ windowId: window.id });
    });
  }
}); 

