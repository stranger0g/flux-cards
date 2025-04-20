document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const addDeckBtn = document.getElementById('add-deck-btn');
    const deckListUl = document.getElementById('deck-list');
    const deckModal = document.getElementById('deck-modal');
    const cardModal = document.getElementById('card-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const deckModalTitle = document.getElementById('deck-modal-title');
    const cardModalTitle = document.getElementById('card-modal-title');
    const deckNameInput = document.getElementById('deck-name-input');
    const editDeckIdInput = document.getElementById('edit-deck-id');
    const saveDeckBtn = document.getElementById('save-deck-btn');
    const cardFrontInput = document.getElementById('card-front-input');
    const cardBackInput = document.getElementById('card-back-input');
    const editCardIdInput = document.getElementById('edit-card-id');
    const saveCardBtn = document.getElementById('save-card-btn');
    const closeBtns = document.querySelectorAll('.close-btn');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalText = document.getElementById('confirm-modal-text');

    const welcomeScreen = document.getElementById('welcome-screen');
    const deckViewScreen = document.getElementById('deck-view-screen');
    const studyScreen = document.getElementById('study-screen');
    const currentDeckNameH2 = document.getElementById('current-deck-name');
    const startStudyBtn = document.getElementById('start-study-btn');
    const addCardToDeckBtn = document.getElementById('add-card-to-deck-btn');
    const editDeckBtn = document.getElementById('edit-deck-btn');
    const deleteDeckBtn = document.getElementById('delete-deck-btn');
    const deckCardListUl = document.getElementById('deck-card-list');
    const cardFilterInput = document.getElementById('card-filter-input');
    const cardCountSpan = document.getElementById('card-count');


    const backToDeckBtn = document.getElementById('back-to-deck-btn');
    const studyDeckNameH2 = document.getElementById('study-deck-name');
    const studyProgress = document.getElementById('study-progress');
    const progressTextSpan = document.getElementById('progress-text');
    const flashcard = document.getElementById('flashcard');
    const cardFrontTextP = document.getElementById('card-front-text');
    const cardBackTextP = document.getElementById('card-back-text');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const difficultyButtonsDiv = document.querySelector('.difficulty-buttons');
    const studyCompleteMessage = document.getElementById('study-complete-message');
    const studyAgainBtn = document.getElementById('study-again-btn');

    // --- App State ---
    let decks = [];
    let currentDeckId = null;
    let currentCardIndex = 0;
    let studySessionCards = [];
    let isCardFlipped = false;
    let currentTheme = localStorage.getItem('theme') || 'light-mode';
    let confirmationCallback = null; // To store the action for confirmation modal

    // --- Constants ---
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const EASE_FACTOR_HARD = 1.2;
    const EASE_FACTOR_GOOD = 2.5;
    const EASE_FACTOR_EASY = 4.0;
    const INITIAL_INTERVAL_DAYS = 1;
    const MIN_INTERVAL_DAYS = 1;

    // --- Data Functions ---
    const saveData = () => {
        localStorage.setItem('flashcardDecks', JSON.stringify(decks));
        localStorage.setItem('theme', currentTheme);
    };

    const loadData = () => {
        const savedDecks = localStorage.getItem('flashcardDecks');
        decks = savedDecks ? JSON.parse(savedDecks) : [];
        // Ensure necessary properties exist on loaded cards (for backward compatibility)
        decks.forEach(deck => {
            deck.cards.forEach(card => {
                card.id = card.id || generateId();
                card.lastReviewed = card.lastReviewed || null;
                card.nextReviewDate = card.nextReviewDate || null;
                card.intervalDays = card.intervalDays || INITIAL_INTERVAL_DAYS;
                card.easeFactor = card.easeFactor || EASE_FACTOR_GOOD; // Default ease factor
            });
        });
        loadTheme();
    };

    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // --- Theme Functions ---
    const applyTheme = () => {
        body.className = currentTheme; // Directly set the class
        themeToggleBtn.innerHTML = currentTheme === 'dark-mode' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    };

    const toggleTheme = () => {
        currentTheme = currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode';
        applyTheme();
        saveData();
    };

    const loadTheme = () => {
        applyTheme();
    };

    // --- Modal Functions ---
    const openModal = (modalId, setupFn = null) => {
        const modal = document.getElementById(modalId);
        if (setupFn) setupFn();
        modal.style.display = 'block';
    };

    const closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
        // Reset common fields
        deckNameInput.value = '';
        editDeckIdInput.value = '';
        cardFrontInput.value = '';
        cardBackInput.value = '';
        editCardIdInput.value = '';
        confirmationCallback = null; // Clear confirmation callback
    };

    const openConfirmModal = (title, text, onConfirm) => {
        confirmationCallback = onConfirm;
        confirmModalTitle.textContent = title;
        confirmModalText.textContent = text;
        openModal('confirm-modal');
    };

    // --- Deck Functions ---
    const renderDeckList = () => {
        deckListUl.innerHTML = ''; // Clear existing list
        if (decks.length === 0) {
             deckListUl.innerHTML = '<li class="no-decks">No decks yet. Add one!</li>';
             return;
        }
        decks.forEach(deck => {
            const li = document.createElement('li');
            li.dataset.deckId = deck.id;
            li.textContent = deck.name;
             const cardCountSpan = document.createElement('span');
            cardCountSpan.className = 'deck-card-count';
            cardCountSpan.textContent = `${deck.cards.length} cards`;
            li.appendChild(cardCountSpan);
            if (deck.id === currentDeckId) {
                li.classList.add('active');
            }
            li.addEventListener('click', () => selectDeck(deck.id));
            deckListUl.appendChild(li);
        });
    };

    const addDeck = (name) => {
        if (!name || name.trim() === '') return alert('Deck name cannot be empty.');
        const newDeck = {
            id: generateId(),
            name: name.trim(),
            cards: [],
        };
        decks.push(newDeck);
        saveData();
        renderDeckList();
        selectDeck(newDeck.id); // Automatically select the new deck
        closeModal('deck-modal');
    };

    const updateDeck = (id, newName) => {
        if (!newName || newName.trim() === '') return alert('Deck name cannot be empty.');
        const deck = decks.find(d => d.id === id);
        if (deck) {
            deck.name = newName.trim();
            saveData();
            renderDeckList();
            if (currentDeckId === id) {
                displayDeckView(id); // Update the view if it's the current deck
            }
            closeModal('deck-modal');
        }
    };

     const deleteDeck = (id) => {
        decks = decks.filter(d => d.id !== id);
        saveData();
        if (currentDeckId === id) {
            currentDeckId = null;
            showScreen('welcome'); // Go back to welcome if current deck deleted
        }
        renderDeckList();
        closeModal('confirm-modal');
    };

    const selectDeck = (id) => {
        currentDeckId = id;
        renderDeckList(); // Update active state in sidebar
        displayDeckView(id);
        showScreen('deck-view');
    };

    const handleAddDeckClick = () => {
        openModal('deck-modal', () => {
            deckModalTitle.textContent = 'Add New Deck';
            editDeckIdInput.value = ''; // Ensure edit ID is clear
        });
    };

    const handleEditDeckClick = () => {
        if (!currentDeckId) return;
        const deck = decks.find(d => d.id === currentDeckId);
        if (deck) {
            openModal('deck-modal', () => {
                deckModalTitle.textContent = 'Edit Deck Name';
                deckNameInput.value = deck.name;
                editDeckIdInput.value = deck.id;
            });
        }
    };

     const handleDeleteDeckClick = () => {
        if (!currentDeckId) return;
        const deck = decks.find(d => d.id === currentDeckId);
        if (deck) {
             openConfirmModal(
                'Delete Deck?',
                `Are you sure you want to delete the deck "${deck.name}" and all its cards? This cannot be undone.`,
                () => deleteDeck(currentDeckId)
            );
        }
    };

    const handleSaveDeck = () => {
        const name = deckNameInput.value;
        const deckIdToEdit = editDeckIdInput.value;
        if (deckIdToEdit) {
            updateDeck(deckIdToEdit, name);
        } else {
            addDeck(name);
        }
    };

    // --- Card Functions ---
     const addCard = (deckId, front, back) => {
        if (!front || front.trim() === '' || !back || back.trim() === '') return alert('Card front and back cannot be empty.');
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            const newCard = {
                id: generateId(),
                front: front.trim(),
                back: back.trim(),
                lastReviewed: null,
                nextReviewDate: null, // Will be reviewed soon
                intervalDays: INITIAL_INTERVAL_DAYS,
                easeFactor: EASE_FACTOR_GOOD,
            };
            deck.cards.push(newCard);
            saveData();
            renderDeckCardList(deckId); // Update card list in deck view
            renderDeckList(); // Update card count in sidebar
            closeModal('card-modal');
        } else {
             alert('Error: Deck not found.');
        }
    };

    const updateCard = (deckId, cardId, front, back) => {
         if (!front || front.trim() === '' || !back || back.trim() === '') return alert('Card front and back cannot be empty.');
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            const card = deck.cards.find(c => c.id === cardId);
            if (card) {
                card.front = front.trim();
                card.back = back.trim();
                // Optionally reset review state upon edit, or keep it
                // card.nextReviewDate = null; // Uncomment to force re-review soon
                saveData();
                renderDeckCardList(deckId); // Update card list
                closeModal('card-modal');
            } else {
                 alert('Error: Card not found in deck.');
            }
        } else {
            alert('Error: Deck not found.');
        }
    };

     const deleteCard = (deckId, cardId) => {
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            deck.cards = deck.cards.filter(c => c.id !== cardId);
            saveData();
            renderDeckCardList(deckId); // Update card list
             renderDeckList(); // Update card count in sidebar
            closeModal('confirm-modal'); // Close confirmation after action
        } else {
             alert('Error: Deck not found.');
        }
    };

    const handleAddCardToDeckClick = () => {
        if (!currentDeckId) return;
        openModal('card-modal', () => {
            cardModalTitle.textContent = 'Add New Card';
            editCardIdInput.value = ''; // Ensure edit ID is clear
        });
    };

     const handleEditCardClick = (deckId, cardId) => {
         const deck = decks.find(d => d.id === deckId);
         if (deck) {
             const card = deck.cards.find(c => c.id === cardId);
             if (card) {
                 openModal('card-modal', () => {
                     cardModalTitle.textContent = 'Edit Card';
                     cardFrontInput.value = card.front;
                     cardBackInput.value = card.back;
                     editCardIdInput.value = card.id;
                 });
             }
         }
     };

    const handleDeleteCardClick = (deckId, cardId) => {
        const deck = decks.find(d => d.id === deckId);
        const card = deck?.cards.find(c => c.id === cardId);
         if (card) {
            openConfirmModal(
                'Delete Card?',
                `Are you sure you want to delete this card? (Front: ${card.front.substring(0, 20)}...)`,
                () => deleteCard(deckId, cardId)
            );
        }
    };

    const handleSaveCard = () => {
        const front = cardFrontInput.value;
        const back = cardBackInput.value;
        const cardIdToEdit = editCardIdInput.value;
        if (cardIdToEdit) {
            updateCard(currentDeckId, cardIdToEdit, front, back);
        } else {
            addCard(currentDeckId, front, back);
        }
    };


    // --- UI Rendering Functions ---
    const showScreen = (screenName) => {
        welcomeScreen.classList.remove('active');
        deckViewScreen.classList.remove('active');
        studyScreen.classList.remove('active');

        document.getElementById(`${screenName}-screen`).classList.add('active');
    };

    const displayDeckView = (deckId) => {
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            currentDeckNameH2.textContent = deck.name;
            cardFilterInput.value = ''; // Reset filter on deck change
            renderDeckCardList(deckId);
            showScreen('deck-view');
        } else {
            showScreen('welcome'); // Fallback if deck not found
        }
    };

    const renderDeckCardList = (deckId, filter = '') => {
         const deck = decks.find(d => d.id === deckId);
         deckCardListUl.innerHTML = ''; // Clear list
         if (!deck) return;

        const lowerCaseFilter = filter.toLowerCase();
        const filteredCards = deck.cards.filter(card =>
             card.front.toLowerCase().includes(lowerCaseFilter) ||
             card.back.toLowerCase().includes(lowerCaseFilter)
         );

        cardCountSpan.textContent = `${filteredCards.length} / ${deck.cards.length} cards`;


         if (filteredCards.length === 0 && deck.cards.length > 0 && filter) {
             deckCardListUl.innerHTML = '<li class="no-results">No cards match your filter.</li>';
         } else if (deck.cards.length === 0) {
             deckCardListUl.innerHTML = '<li class="no-results">This deck is empty. Add some cards!</li>';
         } else {
             filteredCards.forEach(card => {
                 const li = document.createElement('li');
                 li.innerHTML = `
                     <div class="card-list-content">
                         <p><strong>Front:</strong> ${card.front}</p>
                         <p><strong>Back:</strong> ${card.back}</p>
                     </div>
                     <div class="card-list-actions">
                         <button class="edit-card-btn" title="Edit Card" data-card-id="${card.id}"><i class="fas fa-edit"></i></button>
                         <button class="delete-card-btn" title="Delete Card" data-card-id="${card.id}"><i class="fas fa-trash"></i></button>
                     </div>
                 `;
                 // Add event listeners directly to buttons
                 li.querySelector('.edit-card-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent li click
                    handleEditCardClick(deckId, card.id);
                 });
                  li.querySelector('.delete-card-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent li click
                    handleDeleteCardClick(deckId, card.id);
                 });

                 deckCardListUl.appendChild(li);
             });
         }
    };


    // --- Study Session Functions ---
    const getDueCards = (deckId) => {
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return [];
        const now = new Date().getTime();

        return deck.cards
            .filter(card => !card.nextReviewDate || card.nextReviewDate <= now)
             .sort((a, b) => (a.nextReviewDate || 0) - (b.nextReviewDate || 0)); // Sort by review date, oldest first
    };

     const startStudySession = () => {
        if (!currentDeckId) return;
        const deck = decks.find(d => d.id === currentDeckId);
        if (!deck) return;

         studySessionCards = getDueCards(currentDeckId);

        if (studySessionCards.length === 0) {
            alert('No cards due for review in this deck right now!');
            return;
        }

        currentCardIndex = 0;
        studyDeckNameH2.textContent = `Studying: ${deck.name}`;
        studyCompleteMessage.style.display = 'none';
        difficultyButtonsDiv.style.display = 'none'; // Hide initially
        showAnswerBtn.style.display = 'block'; // Show the button
        showAnswerBtn.disabled = false;
        displayCurrentStudyCard();
        updateStudyProgress();
        showScreen('study');
    };

    const displayCurrentStudyCard = () => {
        if (currentCardIndex >= studySessionCards.length) {
            showStudyComplete();
            return;
        }

        const card = studySessionCards[currentCardIndex];
        cardFrontTextP.textContent = card.front;
        cardBackTextP.textContent = card.back; // Set back text even if hidden

        flashcard.classList.remove('is-flipped');
        isCardFlipped = false;
        difficultyButtonsDiv.style.display = 'none';
        showAnswerBtn.style.display = 'block';
        showAnswerBtn.disabled = false;
        updateStudyProgress();
    };

    const showStudyComplete = () => {
        flashcard.style.display = 'none'; // Hide card container
        showAnswerBtn.style.display = 'none';
        difficultyButtonsDiv.style.display = 'none';
        studyCompleteMessage.style.display = 'block';
        progressTextSpan.textContent = `Complete!`;
    };

    const handleShowAnswer = () => {
        flashcard.classList.add('is-flipped');
        isCardFlipped = true;
        showAnswerBtn.disabled = true; // Disable after showing
        showAnswerBtn.style.display = 'none'; // Hide show answer btn
        difficultyButtonsDiv.style.display = 'flex'; // Show difficulty buttons
    };

    const updateStudyProgress = () => {
         const total = studySessionCards.length;
         // Use currentCardIndex for progress before completion, total when complete
         const current = Math.min(currentCardIndex, total);
         const percentage = total === 0 ? 0 : (current / total) * 100;
         studyProgress.value = percentage;
         progressTextSpan.textContent = `${current}/${total}`;
     };

    // --- Spaced Repetition (Simplified Logic) ---
     const calculateNextReview = (card, difficulty) => {
        const now = new Date().getTime();
        card.lastReviewed = now;
        let newIntervalDays;
        let nextEaseFactor = card.easeFactor || EASE_FACTOR_GOOD; // Use existing or default

        switch (difficulty) {
            case 'hard':
                // Reduce interval significantly, decrease ease factor slightly
                 newIntervalDays = Math.max(MIN_INTERVAL_DAYS, card.intervalDays / 1.5);
                 nextEaseFactor = Math.max(1.3, card.easeFactor - 0.15); // Ensure ease doesn't drop too low
                 // For hard, we want to see it again in the current session if possible, or very soon
                 // Let's reset interval to minimum for simplicity here
                 newIntervalDays = MIN_INTERVAL_DAYS / 2; // Review within 12 hours
                 break;
            case 'good':
                // Standard interval increase based on ease factor
                newIntervalDays = Math.max(MIN_INTERVAL_DAYS, card.intervalDays * nextEaseFactor);
                 // Ease factor remains the same for 'good' in this simple model
                break;
            case 'easy':
                 // Increase interval substantially, increase ease factor
                 newIntervalDays = Math.max(MIN_INTERVAL_DAYS, card.intervalDays * nextEaseFactor * 1.5); // Extra boost for easy
                 nextEaseFactor = card.easeFactor + 0.15;
                break;
            default: // Should not happen
                 newIntervalDays = card.intervalDays;
                 break;
        }

         // Limit extreme interval growth (e.g., max 1 year)
        newIntervalDays = Math.min(newIntervalDays, 365);

        card.intervalDays = newIntervalDays;
        card.easeFactor = nextEaseFactor;
         // Calculate next review timestamp
        card.nextReviewDate = now + newIntervalDays * MS_PER_DAY;

        // console.log(`Card: ${card.front.substring(0,10)}, Difficulty: ${difficulty}, New Interval: ${newIntervalDays.toFixed(1)} days, Next Review: ${new Date(card.nextReviewDate).toLocaleDateString()}`);
    };


     const handleDifficultyChoice = (difficulty) => {
         if (!isCardFlipped || currentCardIndex >= studySessionCards.length) return;

         const card = studySessionCards[currentCardIndex];
         const originalCardData = decks.find(d => d.id === currentDeckId)?.cards.find(c => c.id === card.id);

         if (originalCardData) {
             calculateNextReview(originalCardData, difficulty);
             saveData(); // Save updated review data immediately
         }

         currentCardIndex++;
         displayCurrentStudyCard(); // Move to the next card or show completion
     };


    // --- Event Listeners ---
    themeToggleBtn.addEventListener('click', toggleTheme);
    addDeckBtn.addEventListener('click', handleAddDeckClick);
    saveDeckBtn.addEventListener('click', handleSaveDeck);
    saveCardBtn.addEventListener('click', handleSaveCard);
    editDeckBtn.addEventListener('click', handleEditDeckClick);
    deleteDeckBtn.addEventListener('click', handleDeleteDeckClick);
    addCardToDeckBtn.addEventListener('click', handleAddCardToDeckClick);
    startStudyBtn.addEventListener('click', startStudySession);
    backToDeckBtn.addEventListener('click', () => {
        if (currentDeckId) selectDeck(currentDeckId);
        else showScreen('welcome');
    });
    showAnswerBtn.addEventListener('click', handleShowAnswer);
    studyAgainBtn.addEventListener('click', startStudySession); // Study the same deck again


     cardFilterInput.addEventListener('input', (e) => {
        if (currentDeckId) {
             renderDeckCardList(currentDeckId, e.target.value);
        }
    });

    difficultyButtonsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('difficulty-btn')) {
            const difficulty = e.target.dataset.difficulty;
            handleDifficultyChoice(difficulty);
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.dataset.modalId);
        });
    });

    // Confirmation Modal Buttons
    confirmYesBtn.addEventListener('click', () => {
        if (confirmationCallback) {
            confirmationCallback(); // Execute the stored action
        }
         // closeModal('confirm-modal'); // Action function should close if needed, or close here regardless
    });
    confirmNoBtn.addEventListener('click', () => {
        closeModal('confirm-modal');
    });

    // Close modal if clicking outside the content area
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });


    // --- Initialization ---
    loadData(); // Load decks and theme from localStorage
    renderDeckList(); // Display loaded decks
    if (decks.length > 0 && !currentDeckId) {
        // Optionally select the first deck on load if none is active
        // selectDeck(decks[0].id);
         showScreen('welcome'); // Or just show welcome
    } else if (currentDeckId) {
        selectDeck(currentDeckId); // Re-select last active deck (if any)
    } else {
        showScreen('welcome'); // Default to welcome screen
    }
});