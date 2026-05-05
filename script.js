/**
 * Pinterest Clone JavaScript
 * Uses CSS Grid with row spanning for a perfect row and column wise masonry layout.
 */

const gridContainer = document.getElementById('masonry-grid');
const loader = document.getElementById('loader');

let currentPage = Math.floor(Math.random() * 50) + 1;
const limit = 20;
let isFetching = false;

/**
 * Formats a hostname from a URL.
 */
function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return 'picsum.photos';
  }
}

/**
 * Creates a Pin DOM element, calculating its row span based on its aspect ratio.
 */
function createPin(imageMetadata) {
  const pin = document.createElement('div');
  pin.classList.add('pin');

  const aspectRatio = imageMetadata.width / imageMetadata.height;
  
  // Calculate grid row span:
  // We assume a standard column width of about 236px.
  // The actual width is dynamic, but we use ResizeObserver to update row spans if width changes.
  // For initial load, we estimate based on 236px.
  const estimatedWidth = 236;
  const estimatedHeight = estimatedWidth / aspectRatio;
  
  // Grid auto-rows is 10px, gap is handled by margin-bottom: 16px.
  const rowSpan = Math.ceil((estimatedHeight + 16) / 10);
  pin.style.gridRowEnd = `span ${rowSpan}`;

  // Image Element
  const img = document.createElement('img');
  // Load a decently sized image
  const loadWidth = 400; 
  const loadHeight = Math.round(loadWidth / aspectRatio);
  img.src = `https://picsum.photos/id/${imageMetadata.id}/${loadWidth}/${loadHeight}`;
  img.alt = imageMetadata.author;
  img.loading = "lazy";

  // Smooth fade-in
  img.onload = () => {
    img.classList.add('loaded');
  };

  // Hover Overlay Structure
  const overlay = document.createElement('div');
  overlay.classList.add('pin-overlay');

  const saveBtn = document.createElement('button');
  saveBtn.classList.add('pin-save-btn');
  saveBtn.textContent = 'Save';

  const bottomActions = document.createElement('div');
  bottomActions.classList.add('pin-bottom-actions');

  const linkBtn = document.createElement('a');
  linkBtn.classList.add('link-btn');
  linkBtn.href = imageMetadata.url;
  linkBtn.target = '_blank';
  linkBtn.innerHTML = `
    <span class="material-icons-round" style="font-size: 16px;">north_east</span>
    <span class="link-text">${getHostname(imageMetadata.url)}</span>
  `;

  const rightActions = document.createElement('div');
  rightActions.style.display = 'flex';
  rightActions.style.gap = '8px';

  const shareBtn = document.createElement('button');
  shareBtn.classList.add('icon-action-btn');
  shareBtn.innerHTML = '<span class="material-icons-round">ios_share</span>';

  const moreBtn = document.createElement('button');
  moreBtn.classList.add('icon-action-btn');
  moreBtn.innerHTML = '<span class="material-icons-round">more_horiz</span>';

  rightActions.appendChild(shareBtn);
  rightActions.appendChild(moreBtn);

  bottomActions.appendChild(linkBtn);
  bottomActions.appendChild(rightActions);

  overlay.appendChild(saveBtn);
  overlay.appendChild(bottomActions);

  pin.appendChild(img);
  pin.appendChild(overlay);

  return pin;
}

/**
 * Fetches the next batch of images from the API.
 */
async function fetchImages() {
  if (isFetching) return;
  isFetching = true;
  loader.style.opacity = '1';

  try {
    const response = await fetch(`https://picsum.photos/v2/list?page=${currentPage}&limit=${limit}`);
    const data = await response.json();

    const fragment = document.createDocumentFragment();
    data.forEach(item => {
      const pin = createPin(item);
      fragment.appendChild(pin);
    });
    
    // Append to grid container
    gridContainer.appendChild(fragment);

    currentPage++;
  } catch (error) {
    console.error('Error fetching images:', error);
  } finally {
    isFetching = false;
  }
}

/**
 * Dynamically adjust row spans if the window is resized significantly.
 */
function updatePinHeights() {
  const pins = document.querySelectorAll('.pin');
  pins.forEach(pin => {
    const img = pin.querySelector('img');
    if (img && img.naturalWidth) {
       // Recalculate based on actual rendered width
       const rect = pin.getBoundingClientRect();
       const actualWidth = rect.width;
       const aspectRatio = img.naturalWidth / img.naturalHeight;
       const actualHeight = actualWidth / aspectRatio;
       const rowSpan = Math.ceil((actualHeight + 16) / 10);
       pin.style.gridRowEnd = `span ${rowSpan}`;
    }
  });
}

// Debounce resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updatePinHeights, 200);
});

/**
 * Intersection Observer for Infinite Scrolling.
 */
const observerOptions = {
  root: null,
  rootMargin: '200px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !isFetching) {
      fetchImages();
    }
  });
}, observerOptions);

// Initialize
fetchImages(); // Initial load
observer.observe(loader);
