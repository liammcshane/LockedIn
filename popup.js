document.addEventListener('DOMContentLoaded', () => {
  const deactivateButton = document.getElementById('deactivateButton');
  const statusDiv = document.getElementById('status');
  const logoImage = document.getElementById('logoImage');
  const hideSidebarToggle = document.getElementById('hideSidebarToggle');
  const hideCommentsToggle = document.getElementById('hideCommentsToggle');

  let countdownInterval;

  function updateCountdown(deactivatedUntil) {
    const remainingMillis = deactivatedUntil - Date.now();
    if (remainingMillis <= 0) {
      clearInterval(countdownInterval);
      updateDeactivationState(); // Flip back to active state
      return;
    }

    const totalSeconds = Math.floor(remainingMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    statusDiv.textContent = `Deactivated for ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // --- Deactivation Button and Logo Logic ---
  function updateDeactivationState() {
    clearInterval(countdownInterval); // Stop any existing countdown

    chrome.storage.local.get('deactivatedUntil', (data) => {
      const deactivatedUntil = data.deactivatedUntil || 0;
      if (deactivatedUntil > Date.now()) {
        deactivateButton.textContent = 'Lock back in';
        logoImage.src = 'unlocked.png';
        updateCountdown(deactivatedUntil); // Initial display
        countdownInterval = setInterval(() => updateCountdown(deactivatedUntil), 1000);
      } else {
        deactivateButton.textContent = 'Unlock for 60 mins';
        logoImage.src = 'lock.png';
        statusDiv.textContent = 'LockedIn is active.';
      }
    });
  }

  // Initial UI setup
  updateDeactivationState();

  // Listen for storage changes to keep UI in sync if popup remains open
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.deactivatedUntil) {
      updateDeactivationState();
    }
  });

  deactivateButton.addEventListener('click', () => {
    const action = deactivateButton.textContent === 'Lock back in' ? 'reactivate' : 'deactivate';
    chrome.runtime.sendMessage({ action });
  });

  // --- Toggle Logic ---
  function setupToggle(toggleElement, storageKey) {
    // Load saved state
    chrome.storage.local.get(storageKey, (data) => {
      toggleElement.checked = !!data[storageKey];
    });

    // Save state on change
    toggleElement.addEventListener('change', (event) => {
      chrome.storage.local.set({ [storageKey]: event.target.checked });
    });
  }

  setupToggle(hideSidebarToggle, 'hideSidebar');
  setupToggle(hideCommentsToggle, 'hideComments');
  setupToggle(document.getElementById('hideDescriptionToggle'), 'hideDescription');
});
