document.addEventListener('DOMContentLoaded', () => {
    const popupOverlay = document.getElementById('popupOverlay');
    const videoContainer = document.getElementById('videoContainer');
    const popupEpisodeList = document.getElementById('popupEpisodeList');
    const searchBar = document.getElementById('searchBar');
    const onePieceCard = document.querySelector('.folder-card[data-folder="onePiece"]');
    const openMoreButton = document.querySelector('.open-more-button');
    let selectedEpisodeIndex = parseInt(localStorage.getItem('selectedEpisodeIndex'), 10) || 0;
    let popupOpen = localStorage.getItem('popupOpen') === 'true';

    const episodes = Array.from({ length: 1123 }, (_, i) => ({
        name: i === 0 ? 'Trailer' : `Episode ${i}`,
        src: i === 0
            ? 'https://www.youtube.com/embed/X3CR6L9uLd4?autoplay=1&mute=1' // Auto-play for YouTube
            : i === 1
                ? 'https://pixeldrain.com/api/file/L2HEFTfT?autoplay=1' // Auto-play for PixelDrain (Episode 1)
                : i === 2
                    ? 'https://pixeldrain.com/api/file/GcQTpru5?autoplay=1' // Auto-play for PixelDrain (Episode 2)
                    : `https://example.com/onePiece/episode${i}`
    }));

    function saveState() {
        localStorage.setItem('popupOpen', popupOverlay.style.display === 'flex');
        localStorage.setItem('selectedEpisodeIndex', selectedEpisodeIndex);
    }

    function restoreState() {
        const savedEpisodeIndex = parseInt(localStorage.getItem('selectedEpisodeIndex'), 10);
        popupOpen = localStorage.getItem('popupOpen') === 'true';

        if (popupOpen) {
            selectedEpisodeIndex = !isNaN(savedEpisodeIndex) ? savedEpisodeIndex : 0;
            popupOverlay.style.display = 'flex'; // Ensure the popup is visible
            populateEpisodeList();
            playEpisode(selectedEpisodeIndex); // Auto-play the last selected episode
        } else {
            popupOverlay.style.display = 'none';
        }
        saveState(); // Ensure the state is saved after restoring
    }

    function playEpisode(index) {
        const episode = episodes[index];
        if (!episode || !episode.src) {
            console.error('Invalid episode or missing source:', episode);
            return;
        }

        // Ensure the popup remains open when playing an episode
        popupOpen = true;
        saveState();

        // Check if the episode is from PixelDrain
        if (episode.src.includes('pixeldrain.com')) {
            videoContainer.innerHTML = `
                <div class="custom-video-wrapper">
                    <video id="pixelDrainVideo" width="100%" height="100%" controlslist="nofullscreen" autoplay>
                        <source src="${episode.src}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="custom-controls">
                        <div class="custom-buttons">
                            <div id="timeDisplay" class="custom-time-display">0:00</div>
                            <button id="playPauseButton" class="custom-play-pause-button">⏸</button>
                            <button id="fullscreenButton" class="custom-fullscreen-button">⛶</button>
                        </div>
                        <input type="range" id="progressBar" class="custom-progress-bar" value="0" min="0" max="100">
                        <div id="progressTooltip" class="custom-progress-tooltip hidden">0:00</div>
                        <button id="skipIntroButton" class="custom-skip-intro-button hidden">Skip Intro</button>
                        <button id="nextEpisodeButton" class="custom-next-episode-button hidden">Next Episode</button>
                    </div>
                </div>
            `;
            const videoElement = document.getElementById('pixelDrainVideo');
            const progressBar = document.getElementById('progressBar');
            const fullscreenButton = document.getElementById('fullscreenButton');
            const playPauseButton = document.getElementById('playPauseButton');
            const skipIntroButton = document.getElementById('skipIntroButton');
            const timeDisplay = document.getElementById('timeDisplay');
            const progressTooltip = document.getElementById('progressTooltip');
            const nextEpisodeButton = document.getElementById('nextEpisodeButton');

            // Update progress bar as the video plays
            videoElement.addEventListener('timeupdate', () => {
                const progress = (videoElement.currentTime / videoElement.duration) * 100;
                progressBar.value = progress || 0;
                progressBar.style.background = `linear-gradient(to right, #007bff ${progress}%, #444 ${progress}%)`; // Update gradient

                // Update time display
                const minutes = Math.floor(videoElement.currentTime / 60);
                const seconds = Math.floor(videoElement.currentTime % 60).toString().padStart(2, '0');
                timeDisplay.textContent = `${minutes}:${seconds}`;
            });

            // Seek video when progress bar is adjusted
            progressBar.addEventListener('input', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = progressBar.value / 100; // Use the same percentage logic as the tooltip
                const seekTime = percent * videoElement.duration;
                videoElement.currentTime = seekTime; // Ensure the seek time matches the tooltip
            });

            // Add fullscreen toggle functionality
            fullscreenButton.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    videoElement.requestFullscreen().catch((error) => {
                        console.error('Fullscreen failed:', error);
                    });
                } else {
                    document.exitFullscreen().catch((error) => {
                        console.error('Exit fullscreen failed:', error);
                    });
                }
            });

            // Add play/pause toggle functionality
            playPauseButton.addEventListener('click', () => {
                if (videoElement.paused) {
                    videoElement.play();
                    playPauseButton.textContent = '⏸'; // Update to pause icon
                } else {
                    videoElement.pause();
                    playPauseButton.textContent = '▶'; // Update to play icon
                }
            });

            // Update time display
            videoElement.addEventListener('timeupdate', () => {
                const minutes = Math.floor(videoElement.currentTime / 60);
                const seconds = Math.floor(videoElement.currentTime % 60).toString().padStart(2, '0');
                timeDisplay.textContent = `${minutes}:${seconds}`;
            });

            // Add Netflix-style skip intro functionality with animation
            videoElement.addEventListener('timeupdate', () => {
                if (videoElement.currentTime >= 0 && videoElement.currentTime < 37) { // Show skip intro button
                    skipIntroButton.classList.remove('hidden');
                    if (!skipIntroButton.classList.contains('progress-animation')) {
                        skipIntroButton.classList.add('progress-animation'); // Add animation class
                        skipIntroButton.addEventListener('animationend', () => {
                            videoElement.currentTime = 37; // Automatically skip to 00:37
                            skipIntroButton.classList.add('hidden');
                            skipIntroButton.classList.remove('progress-animation'); // Reset animation
                        }, { once: true });
                    }
                } else {
                    skipIntroButton.classList.add('hidden');
                    skipIntroButton.classList.remove('progress-animation'); // Reset animation
                }
            });

            skipIntroButton.addEventListener('click', () => {
                videoElement.currentTime = 37; // Skip to 00:37
                skipIntroButton.classList.add('hidden');
                skipIntroButton.classList.remove('progress-animation'); // Reset animation
            });

            // Add next episode functionality with animation
            videoElement.addEventListener('timeupdate', () => {
                if (videoElement.currentTime >= 1072 && videoElement.currentTime < 1075) { // Show next episode button
                    nextEpisodeButton.classList.remove('hidden');
                    nextEpisodeButton.classList.add('progress-animation');
                    nextEpisodeButton.addEventListener('animationend', () => {
                        playEpisode(index + 1); // Automatically jump to the next episode
                    }, { once: true });
                } else {
                    nextEpisodeButton.classList.add('hidden');
                    nextEpisodeButton.classList.remove('progress-animation'); // Reset animation
                }
            });

            nextEpisodeButton.addEventListener('click', () => {
                playEpisode(index + 1); // Jump to the next episode
            });

            // Ensure metadata is loaded before enabling tooltip functionality
            videoElement.addEventListener('loadedmetadata', () => {
                console.log('Video duration:', videoElement.duration); // Debugging

                const updateTooltip = (e) => {
                    const rect = progressBar.getBoundingClientRect();
                    console.log('Progress bar dimensions:', rect); // Debugging

                    const thumbWidth = 10; // Width of the progress bar thumb (in pixels)
                    const adjustedWidth = rect.width; // Use the full width of the progress bar
                    const offsetX = e.clientX - rect.left; // Adjust mouse position
                    const percent = Math.min(Math.max(offsetX / adjustedWidth, 0), 1); // Clamp between 0 and 1
                    const hoverTime = Math.round(percent * videoElement.duration); // Round to nearest second
                    console.log('Hover time (seconds):', hoverTime); // Debugging

                    const minutes = Math.floor(hoverTime / 60);
                    const seconds = Math.floor(hoverTime % 60).toString().padStart(2, '0');
                    progressTooltip.textContent = `${minutes}:${seconds}`;

                    // Position tooltip directly above the mouse
                    const tooltipX = Math.min(Math.max(offsetX, 0), rect.width); // Clamp tooltip position
                    progressTooltip.style.left = `${tooltipX}px`;
                    progressTooltip.classList.remove('hidden');
                };

                progressBar.addEventListener('mousemove', updateTooltip);

                progressBar.addEventListener('mouseleave', () => {
                    progressTooltip.classList.add('hidden');
                });

                // Fix seek time to match tooltip
                progressBar.addEventListener('input', () => {
                    const seekPercent = progressBar.value / 100;
                    const seekTime = Math.round(seekPercent * videoElement.duration); // Round to nearest second
                    console.log('Seek time (seconds):', seekTime); // Debugging
                    videoElement.currentTime = seekTime; // Ensure the seek time matches the tooltip
                });

                // Fix seek on click to align with the thumb
                progressBar.addEventListener('click', (e) => {
                    const rect = progressBar.getBoundingClientRect();
                    const adjustedWidth = rect.width; // Use the full width of the progress bar
                    const offsetX = e.clientX - rect.left; // Adjust mouse position
                    const percent = Math.min(Math.max(offsetX / adjustedWidth, 0), 1); // Clamp between 0 and 1
                    const seekTime = Math.round(percent * videoElement.duration); // Round to nearest second
                    videoElement.currentTime = seekTime; // Ensure the seek time matches the click position
                    progressBar.value = percent * 100; // Update the slider's value
                    progressBar.style.background = `linear-gradient(to right, #007bff ${percent * 100}%, #444 ${percent * 100}%)`; // Update gradient
                });
            });

            videoElement.play().catch((error) => {
                console.error('Auto-play failed:', error);
            });
        } else {
            // Default iframe embedding for other sources
            videoContainer.innerHTML = `
                <iframe width="100%" height="100%" src="${episode.src}" 
                    title="Video Player" frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen>
                </iframe>
            `;
        }

        selectedEpisodeIndex = index;
        highlightSelectedButton(index);
        saveState();
    }

    function highlightSelectedButton(selectedIndex) {
        const buttons = popupEpisodeList.querySelectorAll('button');
        buttons.forEach((button) => {
            const buttonEpisodeIndex = parseInt(button.dataset.episode, 10);
            button.classList.toggle('selected', buttonEpisodeIndex === selectedIndex);
        });
    }

    function populateEpisodeList(filter = '') {
        popupEpisodeList.innerHTML = '';

        // Add the trailer button
        const trailerButton = document.createElement('button');
        trailerButton.textContent = '▶ Trailer';
        trailerButton.className = 'trailer-button';
        trailerButton.dataset.episode = 0;
        trailerButton.onclick = () => playEpisode(0);
        if (selectedEpisodeIndex === 0) trailerButton.classList.add('selected');
        popupEpisodeList.appendChild(trailerButton);

        // Add the separator
        const separator = document.createElement('div');
        separator.className = 'separator';
        popupEpisodeList.appendChild(separator);

        // Add the episode buttons
        episodes
            .filter((episode, index) => filter === '' || index.toString().includes(filter))
            .forEach((episode, index) => {
                if (index === 0) return;
                const button = document.createElement('button');
                button.textContent = episode.name;
                button.dataset.episode = index;
                button.onclick = () => playEpisode(index);
                if (index === selectedEpisodeIndex) button.classList.add('selected');
                popupEpisodeList.appendChild(button);
            });
    }

    function setupHoverCardPlayButton() {
        const playButton = onePieceCard.querySelector('.hover-episode-list .play-button');
        playButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the card's click event
            popupOverlay.style.display = 'flex';
            popupOpen = true; // Ensure popupOpen is set to true
            saveState(); // Save the updated state
            populateEpisodeList();
            playEpisode(selectedEpisodeIndex); // Play the last selected episode or default
        });
    }

    function setupHoverCardEpisodes() {
        const hoverEpisodeButtons = onePieceCard.querySelectorAll('.hover-episode-list button[data-episode]');
        hoverEpisodeButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the card's click event
                const episodeIndex = parseInt(button.dataset.episode, 10);
                if (!isNaN(episodeIndex)) {
                    popupOverlay.style.display = 'flex';
                    popupOpen = true;
                    saveState();
                    populateEpisodeList();
                    playEpisode(episodeIndex); // Play the selected episode
                }
            });
        });
    }

    onePieceCard.addEventListener('click', () => {
        popupOverlay.style.display = 'flex';
        popupOpen = true;
        saveState();
        populateEpisodeList();
        playEpisode(selectedEpisodeIndex); // Ensure the selected episode plays
    });

    openMoreButton.addEventListener('click', () => {
        popupOverlay.style.display = 'flex';
        popupOpen = true;
        saveState();
        populateEpisodeList();
    });

    searchBar.addEventListener('input', (e) => {
        const filter = e.target.value;
        populateEpisodeList(filter);
        highlightSelectedButton(selectedEpisodeIndex);
    });

    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.style.display = 'none';
            popupOpen = false;
            saveState();
        }
    });

    restoreState();
    setupHoverCardPlayButton(); // Initialize hover card play button
    setupHoverCardEpisodes(); // Initialize hover card episode buttons
});
