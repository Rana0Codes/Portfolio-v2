/**
 * Juyel OS — Interactive Whiteboard & Sticky Notes
 * Allows visitors to create, drag, edit, and delete notes with localStorage persistence.
 */

export class WhiteboardController {
  constructor() {
    this.storageKey = 'personal-os-whiteboard-v1';
    this.notes = [];
    this.currentColor = '#fef08a'; // Default soft yellow
    this.colors = [
      { name: 'Yellow', val: '#fef08a', text: '#713f12' },
      { name: 'Cyan', val: '#a5f3fc', text: '#155e75' },
      { name: 'Green', val: '#bbf7d0', text: '#14532d' },
      { name: 'Purple', val: '#e9d5ff', text: '#581c87' },
      { name: 'Rose', val: '#fecdd3', text: '#881337' }
    ];

    this.init();
  }

  init() {
    this.loadNotes();
    this.renderToolbar();
    this.renderCanvas();
  }

  loadNotes() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.notes = JSON.parse(data);
      } else {
        // Initial welcome notes
        this.notes = [
          {
            id: 'note-1',
            text: 'Welcome to Juyel.OS Whiteboard! 🚀\nAdd your own ideas, feedback, or reminders.',
            color: '#a5f3fc',
            textColor: '#155e75',
            x: 24,
            y: 24
          },
          {
            id: 'note-2',
            text: 'Check out BachatGuru in the Projects app — real-time Flutter expense tracker.',
            color: '#bbf7d0',
            textColor: '#14532d',
            x: 260,
            y: 36
          }
        ];
        this.saveNotes();
      }
    } catch (err) {
      this.notes = [];
    }
  }

  saveNotes() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
    } catch (err) {
      // Storage fallback
    }
  }

  renderToolbar() {
    const mount = document.getElementById('whiteboard-toolbar-mount');
    if (!mount) return;

    mount.innerHTML = `
      <div class="whiteboard-toolbar">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="btn-primary" id="add-sticky-btn" style="padding: 6px 14px; font-size: 11px;">
            <i class="fas fa-plus"></i> Add Sticky Note
          </button>
          <div class="color-picker-strip">
            ${this.colors.map(c => `
              <div class="color-dot-choice ${c.val === this.currentColor ? 'selected' : ''}" 
                   data-color="${c.val}" 
                   data-text="${c.text}"
                   style="background-color: ${c.val};" 
                   title="${c.name}"></div>
            `).join('')}
          </div>
        </div>
        <button class="nav-pill-btn" id="reset-board-btn" style="font-size: 11px; color: var(--color-danger);">
          <i class="fas fa-trash-alt"></i> Reset Canvas
        </button>
      </div>
    `;

    // Color choices
    mount.querySelectorAll('.color-dot-choice').forEach((dot) => {
      dot.addEventListener('click', () => {
        mount.querySelectorAll('.color-dot-choice').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        this.currentColor = dot.getAttribute('data-color');
      });
    });

    // Add sticky
    const addBtn = mount.querySelector('#add-sticky-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addNote();
      });
    }

    // Reset board
    const resetBtn = mount.querySelector('#reset-board-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Clear all sticky notes?')) {
          this.notes = [];
          this.saveNotes();
          this.renderCanvas();
        }
      });
    }
  }

  addNote() {
    const activeColorObj = this.colors.find(c => c.val === this.currentColor) || this.colors[0];
    const newNote = {
      id: `note-${Date.now()}`,
      text: 'New note...',
      color: activeColorObj.val,
      textColor: activeColorObj.text,
      x: 30 + (this.notes.length * 20) % 200,
      y: 30 + (this.notes.length * 20) % 150
    };
    this.notes.push(newNote);
    this.saveNotes();
    this.renderCanvas();
  }

  renderCanvas() {
    const canvas = document.getElementById('whiteboard-canvas-mount');
    if (!canvas) return;

    canvas.innerHTML = '';

    if (this.notes.length === 0) {
      canvas.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-dim); font-size: 13px;">
          Canvas is empty. Click "+ Add Sticky Note" above to post a note!
        </div>
      `;
      return;
    }

    this.notes.forEach((note) => {
      const card = document.createElement('div');
      card.className = 'sticky-note-card';
      card.id = note.id;
      card.style.backgroundColor = note.color;
      card.style.color = note.textColor;
      card.style.left = `${note.x}px`;
      card.style.top = `${note.y}px`;

      card.innerHTML = `
        <span class="sticky-delete-btn" title="Delete Note"><i class="fas fa-times"></i></span>
        <textarea aria-label="Sticky Note Content">${note.text}</textarea>
      `;

      // Text change
      const textarea = card.querySelector('textarea');
      textarea.addEventListener('input', (e) => {
        note.text = e.target.value;
        this.saveNotes();
      });

      // Delete note
      const deleteBtn = card.querySelector('.sticky-delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.notes = this.notes.filter(n => n.id !== note.id);
        this.saveNotes();
        this.renderCanvas();
      });

      // Dragging sticky note
      this.setupNoteDragging(card, note, canvas);

      canvas.appendChild(card);
    });
  }

  setupNoteDragging(card, note, canvas) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initLeft = 0;
    let initTop = 0;

    const onPointerDown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.closest('.sticky-delete-btn')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initLeft = note.x;
      initTop = note.y;
      card.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = Math.max(0, Math.min(initLeft + dx, canvas.clientWidth - 220));
      let newY = Math.max(0, Math.min(initTop + dy, canvas.clientHeight - 160));

      note.x = newX;
      note.y = newY;
      card.style.left = `${newX}px`;
      card.style.top = `${newY}px`;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.saveNotes();
      try {
        card.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    card.addEventListener('pointerdown', onPointerDown);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerup', onPointerUp);
    card.addEventListener('pointercancel', onPointerUp);
  }
}

export const whiteboardController = new WhiteboardController();
