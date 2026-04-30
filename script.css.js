/**
 * Habit Tracker Application Logic
 * Implements advanced ES6+ features, DOM manipulation, and LocalStorage
 */

// --- State Management ---
// Initialize habits array from localStorage or default to empty array
let habits = JSON.parse(localStorage.getItem('habits')) || [];

// --- DOM Elements Collection ---
// Using querySelector to target specific elements
const form = document.querySelector('#habit-form');
const input = document.querySelector('#habit-input');
const habitsList = document.querySelector('#habits-list');
const emptyState = document.querySelector('#empty-state');
const loadingSpinner = document.querySelector('#loading-spinner');
const toastContainer = document.querySelector('#toast-container');

// --- Utility Functions ---

// Arrow function to generate a unique ID
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// Arrow function to get today's date in YYYY-MM-DD format based on local timezone
const getTodayString = () => {
    const today = new Date();
    // Adjust for local timezone offset
    const offset = today.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    return localISOTime;
};

// Function to check if a provided date string represents yesterday
const isYesterday = (dateString) => {
    if (!dateString) return false;
    
    const today = new Date(getTodayString());
    const dateToCheck = new Date(dateString);
    
    const timeDiff = today.getTime() - dateToCheck.getTime();
    const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff === 1;
};

// Simulate asynchronous behavior (e.g., API calls) using Promises
const simulateAsync = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- UI Interaction Functions ---

// Function to show animated toast notifications
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✨';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
};

// Save current habits state to localStorage
const saveHabits = () => {
    localStorage.setItem('habits', JSON.stringify(habits));
};

// Toggle the empty state UI depending on habits length
const updateEmptyState = () => {
    if (habits.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
};

// Create a single habit DOM element
// Using Object Destructuring in parameters
const createHabitCard = ({ id, name, streak, isCompletedToday }) => {
    const card = document.createElement('div');
    card.className = `habit-card ${isCompletedToday ? 'completed' : ''}`;
    card.dataset.id = id;

    // Use template literals for dynamic HTML generation
    card.innerHTML = `
        <div class="habit-info">
            <span class="habit-name">${name}</span>
            <span class="streak-info">
                🔥 ${streak} ${streak === 1 ? 'day' : 'days'} streak
            </span>
        </div>
        <div class="habit-actions">
            <button class="action-btn complete-btn" aria-label="Complete habit" title="${isCompletedToday ? 'Completed today' : 'Mark as complete'}">
                ${isCompletedToday ? '✓' : '○'}
            </button>
            <button class="action-btn delete-btn" aria-label="Delete habit" title="Delete habit">
                🗑️
            </button>
        </div>
    `;

    return card;
};

// Main render function: maps through state and updates DOM
const renderHabits = () => {
    habitsList.innerHTML = '';
    const today = getTodayString();

    // Data Transformation Pipeline using .map()
    const updatedHabits = habits.map(habit => {
        const { lastCompleted } = habit; // Destructuring
        let { streak } = habit;
        const isCompletedToday = lastCompleted === today;

        // Core Streak Logic: Reset if last completion was not today AND not yesterday
        if (lastCompleted && !isCompletedToday && !isYesterday(lastCompleted)) {
            streak = 0;
            habit.streak = streak; // update object
        }

        // Return a new object with spread operator
        return { ...habit, isCompletedToday };
    });
    
    // Save state in case streaks were automatically reset above
    habits = updatedHabits;
    saveHabits();

    // DOM update pipeline using .forEach()
    updatedHabits.forEach(habit => {
        const card = createHabitCard(habit);
        habitsList.appendChild(card);
    });

    updateEmptyState();
};

// --- Event Listeners ---

// Handle Form Submission (Adding new habits)
// Using async/await for simulated network latency
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const habitName = input.value.trim();
    if (!habitName) return;

    // 1. UI Feedback: Disable input & show loading spinner
    input.disabled = true;
    const submitBtn = form.querySelector('button');
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    // 2. Simulate network delay (e.g., 800ms)
    await simulateAsync(800);

    // 3. Create new habit object
    const newHabit = {
        id: generateId(),
        name: habitName,
        streak: 0,
        lastCompleted: null,
        createdAt: new Date().toISOString()
    };

    // 4. Update State
    habits.push(newHabit);
    saveHabits();
    
    // 5. Restore UI state
    input.value = '';
    input.disabled = false;
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    input.focus();

    // 6. Provide Success Feedback & Re-render
    showToast('Habit added successfully!');
    renderHabits();
});

// Handle Habit Actions via Event Delegation
habitsList.addEventListener('click', async (e) => {
    const target = e.target;
    
    // Find closest button (handles clicks on icon inside button)
    const btn = target.closest('.action-btn');
    if (!btn) return;

    const card = btn.closest('.habit-card');
    if (!card) return;
    
    const id = card.dataset.id;

    // --- Delete Action ---
    if (btn.classList.contains('delete-btn')) {
        // Add fade out/slide out animation
        card.style.animation = 'slideUp 0.3s ease reverse forwards';
        
        // Wait for animation to complete
        await simulateAsync(300); 
        
        // Update State using .filter()
        habits = habits.filter(h => h.id !== id);
        saveHabits();
        
        showToast('Habit deleted', 'error');
        renderHabits();
    } 
    
    // --- Complete Action ---
    else if (btn.classList.contains('complete-btn')) {
        const today = getTodayString();
        
        // Find habit index
        const habitIndex = habits.findIndex(h => h.id === id);
        
        if (habitIndex > -1) {
            const habit = habits[habitIndex];
            
            // Prevent multiple completions on the same day
            if (habit.lastCompleted === today) {
                showToast('Already completed today!', 'error');
                return;
            }

            // Apply streak increment logic
            if (isYesterday(habit.lastCompleted)) {
                habit.streak += 1;
            } else if (habit.lastCompleted !== today) {
                habit.streak = 1; // Start a new streak
            }

            habit.lastCompleted = today;
            
            // Update State
            saveHabits();
            showToast(`Awesome! ${habit.streak} day streak 🔥`);
            renderHabits();
        }
    }
});

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', renderHabits);
