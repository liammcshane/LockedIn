let isVideoPlaying = false;
let scrubProtectionEnabled = true;
let isDeactivated = false;
let hideSidebar = false;
let hideComments = false;
let hideDescription = false;

// Function to update the deactivation status
function updateInitialState() {
  chrome.storage.local.get(['deactivatedUntil', 'hideSidebar', 'hideComments', 'hideDescription'], (data) => {
    if (chrome.runtime.lastError) {
      isDeactivated = false;
      hideSidebar = false;
      hideComments = false;
      hideDescription = false;
    } else {
      const deactivatedUntil = data.deactivatedUntil || 0;
      isDeactivated = Date.now() < deactivatedUntil;
      hideSidebar = !!data.hideSidebar;
      hideComments = !!data.hideComments;
      hideDescription = !!data.hideDescription;
    }
    updateSidebarVisibility();
    updateCommentsVisibility();
    updateDescriptionVisibility();
  });
}

// Initial check
updateInitialState();

// Listen for changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.deactivatedUntil) {
    const deactivatedUntil = changes.deactivatedUntil.newValue || 0;
    isDeactivated = Date.now() < deactivatedUntil;
  }
  if (changes.hideSidebar) {
    hideSidebar = !!changes.hideSidebar.newValue;
    updateSidebarVisibility();
  }
  if (changes.hideComments) {
    hideComments = !!changes.hideComments.newValue;
    updateCommentsVisibility();
  }
  if (changes.hideDescription) {
    hideDescription = !!changes.hideDescription.newValue;
    updateDescriptionVisibility();
  }
});

function updateSidebarVisibility() {
  waitForElement('#secondary', (sidebar) => {
    if (hideSidebar && isVideoPlaying) {
      sidebar.style.display = 'none';
    } else {
      sidebar.style.display = '';
    }
  });
}

function updateCommentsVisibility() {
  waitForElement('#comments', (comments) => {
    if (hideComments && isVideoPlaying) {
      comments.style.display = 'none';
    } else {
      comments.style.display = '';
    }
  });
}

function updateDescriptionVisibility() {
  waitForElement('#description-inner.ytd-watch-metadata', (description) => {
    if (hideDescription && isVideoPlaying) {
      description.style.display = 'none';
    } else {
      description.style.display = '';
    }
  });
}

// Check if LockedIn is currently deactivated
function isTemporarilyDeactivated() {
  return isDeactivated;
}

// Async function to prevent skipping
async function preventSkip(event) {
  console.log("LockedIn: preventSkip called. isDeactivated:", isDeactivated);
  if (await isTemporarilyDeactivated()) {
    return; // Unlocked when deactivated
  }

  if (isVideoPlaying) {
    try {
      // Create a lock image
      const lockImage = document.createElement('img');
      lockImage.src = chrome.runtime.getURL('lock.png');
      lockImage.style.position = 'absolute';
      lockImage.style.left = `${event.clientX}px`;
      lockImage.style.top = `${event.clientY}px`;
      lockImage.style.width = '24px';
      lockImage.style.height = '24px';
      lockImage.style.zIndex = '9999';
      lockImage.style.transition = 'opacity 0.5s';
      document.body.appendChild(lockImage);

      // Fade out the image
      setTimeout(() => {
        lockImage.style.opacity = '0';
      }, 500);

      // Remove the image after the fade out
      setTimeout(() => {
        lockImage.remove();
      }, 1000);
    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.log('LockedIn: Extension context invalidated. Skipping lock image.');
      } else {
        throw error;
      }
    }

    // Prevent the default action (navigation)
    event.preventDefault();
    event.stopPropagation();
    event.target.blur();
    if (event.target.tagName === 'INPUT') {
      event.target.disabled = true;
      setTimeout(() => {
        event.target.disabled = false;
      }, 100);
    }
    console.log("LockedIn: Kept user LockedIn.");
    logEvent(event, true);
  }
}

// Helper function to wait for an element to exist before executing a callback
function waitForElement(selector, callback) {
  const element = document.querySelector(selector);
  if (element) {
    callback(element);
    return;
  }

  const observer = new MutationObserver((mutations, obs) => {
    const el = document.querySelector(selector);
    if (el) {
      obs.disconnect(); // Stop observing once the element is found
      callback(el);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Sets up the listeners for UI elements that can be blocked
function setupInteractionListeners() {
  // Wait for each UI element individually to prevent race conditions
  waitForElement('#logo', (logo) => {
    logo.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to YouTube logo.");
  });

  waitForElement('#voice-search-button', (voiceSearchButton) => {
    voiceSearchButton.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to voice search button.");
  });

  waitForElement('.ytp-next-button', (nextButton) => {
    nextButton.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to next button.");
  });

  waitForElement('.ytp-prev-button', (prevButton) => {
    prevButton.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to prev button.");
  });

  waitForElement('form.ytSearchboxComponentSearchForm', (searchForm) => {
    searchForm.addEventListener('submit', preventSkip, true);
    console.log("LockedIn: Attached listener to search form.");
  });

  waitForElement('input.ytSearchboxComponentInput', (searchInput) => {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        preventSkip(event);
      }
    }, true);
    searchInput.addEventListener('click', preventSkip, true);
    searchInput.addEventListener('mousedown', preventSkip, true);
    console.log("LockedIn: Attached listener to search input.");
  });

  waitForElement('yt-searchbox', (searchBox) => {
    searchBox.addEventListener('click', preventSkip, true);
    searchBox.addEventListener('mousedown', preventSkip, true);
    console.log("LockedIn: Attached listener to search box.");
  });

  waitForElement('button.ytSearchboxComponentSearchButton', (searchButton) => {
    searchButton.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to search button.");
  });

  waitForElement('a[title="Shorts"]', (shortsLink) => {
    shortsLink.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to Shorts link.");
  });

  waitForElement('ytd-shorts', (shorts) => {
    shorts.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to ytd-shorts.");
  });

  waitForElement('.yt-lockup-view-model', (lockupViewModel) => {
    lockupViewModel.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to suggested videos.");
  });

  waitForElement('ytd-playlist-panel-renderer', (playlistPanel) => {
    playlistPanel.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to playlist panel.");
  });

  waitForElement('ytd-comments#comments', (comments) => {
    comments.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to comments.");
  });

  waitForElement('yt-chip-cloud-renderer', (chipCloud) => {
    chipCloud.addEventListener('click', preventSkip, true);
    console.log("LockedIn: Attached listener to chip cloud.");
  });

  waitForElement('.ytp-progress-bar-container', (progressBar) => {
    progressBar.addEventListener('mousedown', async (event) => {
      if (await isTemporarilyDeactivated()) {
        return; // Don't block anything if deactivated
      }

      if (isVideoPlaying && scrubProtectionEnabled) {
        if (!confirm("Are you sure you want to change the video time?")) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          scrubProtectionEnabled = false; // Deactivated
        }
      }
    }, true);
    console.log("LockedIn: Attached listener to progress bar.");
  });
}

// --- Main Initialization Logic ---

// 1. Wait for the main player container to exist
waitForElement('#movie_player', (player) => {
  console.log('LockedIn: Found #movie_player. Initializing state and observers.');

  // 2. Function to update our plugin's state based on the player's classes
  const updateStateFromPlayer = () => {
    const isPlayingOrPaused = player.classList.contains('playing-mode') || player.classList.contains('paused-mode');
    const hasEnded = player.classList.contains('ended-mode');
    const newState = isPlayingOrPaused && !hasEnded;

    if (newState !== isVideoPlaying) {
      isVideoPlaying = newState;
      console.log(`LockedIn: State changed. isVideoPlaying is now ${isVideoPlaying}`);
      
      // Reset scrub protection when a new video starts playing
      if (isVideoPlaying) {
        scrubProtectionEnabled = true;
      }

      // Update UI visibility
      updateSidebarVisibility();
      updateCommentsVisibility();
      updateDescriptionVisibility();
    }
  };

  // 3. Create an observer to watch for class changes on the player
  const playerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updateStateFromPlayer();
        return; // No need to check other mutations
      }
    }
  });

  // 4. Start observing the player for attribute changes
  playerObserver.observe(player, { attributes: true });

  // 5. Set the initial state of the plugin
  updateStateFromPlayer();
});

// 6. Set up listeners for all other interactions
setupInteractionListeners();

// 7. Global click listener for blocking navigation away from the page
document.body.addEventListener('click', async (event) => {
  if (await isTemporarilyDeactivated()) {
    return; // Unlocked when deactivated
  }

  if (isVideoPlaying) {
    const target = event.target;
    const link = target.closest('a');

    // Block clicks on suggested videos and playlist panels
    if (target.closest('.yt-lockup-view-model') || target.closest('ytd-playlist-panel-renderer')) {
      preventNavigation(event, target);
      return;
    }

    // If the click is on a link with a destination, block it.
    if (link && link.href) {
      // Don't block interactions with the player controls.
      if (target.closest('.ytp-chrome-bottom')) {
        return;
      }

      console.log("LockedIn: Prevented navigation to link:", link.href);
      preventNavigation(event, link);
    }
  }
}, true);

function preventNavigation(event, element) {
  try {
    // Create a lock image
    const lockImage = document.createElement('img');
    lockImage.src = chrome.runtime.getURL('lock.png');
    lockImage.style.position = 'absolute';
    lockImage.style.left = `${event.clientX}px`;
    lockImage.style.top = `${event.clientY}px`;
    lockImage.style.width = '24px';
    lockImage.style.height = '24px';
    lockImage.style.zIndex = '9999';
    lockImage.style.transition = 'opacity 0.5s';
    document.body.appendChild(lockImage);

    // Fade out the image
    setTimeout(() => {
      lockImage.style.opacity = '0';
    }, 500);

    // Remove the image after the fade out
    setTimeout(() => {
      lockImage.remove();
    }, 1000);
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.log('LockedIn: Extension context invalidated. Skipping lock image.');
    } else {
      throw error;
    }
  }

  // Prevent the default action (navigation)
  event.preventDefault();
  event.stopPropagation();
  console.log("LockedIn: Kept user LockedIn on link click.");
  logEvent(event, true);
}

// --- Event Logging for Debugging ---
// Uncomment to log to JS console for debugging if YouTube page elements aren't correctly blocked
function logEvent(event, isBlocked) {
  // const target = event.target;
  // const link = target.closest('a');
  // const parent = target.parentElement;

  // console.log('----------------------------------------');
  // console.log(`LockedIn Event Log:`);
  // console.log(`  - Event Type: ${event.type}`);
  // console.log(`  - Target Element: <${target.tagName.toLowerCase()} id="${target.id}" class="${target.className}">`);
  // if (parent) {
  //   console.log(`  - Parent Element: <${parent.tagName.toLowerCase()} id="${parent.id}" class="${parent.className}">`);
  // }
  // if (link) {
  //   console.log(`  - Link Href: ${link.href}`);
  // }
  // console.log(`  - Is Blocked: ${isBlocked}`);
  // console.log('----------------------------------------');
}

// Add a global click listener to log all clicks
document.body.addEventListener('click', (event) => {
  if (!event.defaultPrevented) {
    logEvent(event, false);
  }
}, true); // Use capturing to log the event before it's potentially stopped
