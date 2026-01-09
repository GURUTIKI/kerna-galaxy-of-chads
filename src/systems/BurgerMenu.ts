
/**
 * Burger Menu System
 * Handles the draggable floating menu logic.
 */

export class BurgerMenu {
    private container: HTMLElement;
    private toggleBtn: HTMLElement;
    private itemsContainer: HTMLElement;

    private isDragging: boolean = false;
    private isMenuOpen: boolean = false;

    // Drag state
    private startX: number = 0;
    private startY: number = 0;
    private initialLeft: number = 0;
    private initialTop: number = 0;
    private hasMoved: boolean = false; // To distinguish click from drag

    // Config
    private readonly SNAP_THRESHOLD = 100; // Distance to edge to snap (not used if snapping to nearest corner always)
    private readonly MARGIN = 20;

    constructor() {
        this.container = document.getElementById('burger-menu-container') as HTMLElement;
        this.toggleBtn = document.getElementById('burger-toggle') as HTMLElement;
        this.itemsContainer = document.getElementById('burger-items') as HTMLElement;

        if (!this.container || !this.toggleBtn) {
            console.warn("Burger Menu elements not found in DOM.");
            return;
        }

        this.setupDrag();
        this.setupToggle();

        // Initial positioning: Top Right
        // We set it via JS to ensure it's absolute/fixed logic is consistent
        this.setPosition(window.innerWidth - 60 - this.MARGIN, this.MARGIN);
        this.updateExpansionDirection();

        // Handle window resize to keep it on screen
        window.addEventListener('resize', () => this.snapToCorner());
    }

    private setupDrag(): void {
        const handleStart = (clientX: number, clientY: number) => {
            if (this.isMenuOpen) this.closeMenu(); // Close if starting to drag

            this.isDragging = true;
            this.hasMoved = false;
            this.toggleBtn.classList.add('dragging');

            this.startX = clientX;
            this.startY = clientY;

            const rect = this.container.getBoundingClientRect();
            this.initialLeft = rect.left;
            this.initialTop = rect.top;
        };

        const handleMove = (clientX: number, clientY: number) => {
            if (!this.isDragging) return;

            const dx = clientX - this.startX;
            const dy = clientY - this.startY;

            // Threshold to consider it a drag and not a sloppy click
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.hasMoved = true;
            }

            let newLeft = this.initialLeft + dx;
            let newTop = this.initialTop + dy;

            // Boundary checks
            const maxLeft = window.innerWidth - this.container.offsetWidth;
            const maxTop = window.innerHeight - this.container.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            this.container.style.left = `${newLeft}px`;
            this.container.style.top = `${newTop}px`;

            // Remove 'right' property if it was set, strictly use left/top for dragging
            this.container.style.right = 'auto';
            this.container.style.bottom = 'auto';
        };

        const handleEnd = () => {
            if (!this.isDragging) return;

            this.isDragging = false;
            this.toggleBtn.classList.remove('dragging');

            if (this.hasMoved) {
                this.snapToCorner();
            }
        };

        // Mouse Events
        this.toggleBtn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection
            handleStart(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            handleMove(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', () => {
            handleEnd();
        });

        // Touch Events
        this.toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling while dragging
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.isDragging) e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

        window.addEventListener('touchend', () => {
            handleEnd();
        });
    }

    private setupToggle(): void {
        const toggleHandler = (e: Event) => {
            // If we dragged, don't toggle
            if (this.hasMoved) return;

            this.toggleMenu();
        };

        // We use click for logic, dragging is handled separately.
        // However, 'click' might fire after mouseup. 
        // We need to ensure we don't double fire or fire on drag end.

        this.toggleBtn.addEventListener('click', toggleHandler);
        // Note: touch interfaces often fire click after touchend if not prevented. 
        // Our touchstart prevents default, so click might not fire on touch devices?
        // Actually we preventDefault on touchstart to stop scrolling, which usually kills the click event too.
        // So we need to handle "tap" within touchend if we want it to work on mobile specifically via that path,
        // OR we don't preventDefault on touchstart unless we start moving.

        // Better approach: Handle "Tap" manually in handleEnd if no movement occurred?
        // But for Mouse, 'click' works fine. 
        // Let's rely on the fact that if 'hasMoved' is false in handleEnd, we could manually trigger click logic if needed,
        // OR just ensure 'click' event fires.
        // Since I prevented default on touchstart, 'click' won't fire on Mobile. I need to handle it.

        // I'll add a manual trigger in handleEnd for taps if needed, but let's stick to simple "click" for mouse
        // and add a manual call for touch.
    }

    // Explicit toggle function that can be called from TouchEnd if it was a Tap
    // Actually, let's keep it simple: simpler is better. 
    // I'll modify the TouchEnd logic to call toggleMenu if !hasMoved.

    /* 
       Refined Touch End:
       if (!this.hasMoved && this.isDragging (was dragging state)) {
           this.toggleMenu(); 
       }
       However, setupDrag handles handleEnd. I'll modify handleEnd logic inside setupDrag?
       No, I'll just leave it and see if click works. 
       Actually, `e.preventDefault()` on touchstart DOES block click.
       So I MUST trigger toggle manually on touch tap.
    */

    private toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;

        if (this.isMenuOpen) {
            this.itemsContainer.classList.add('active');
            // Ensure connection with listener
            this.setupOutsideClickListener();
        } else {
            this.itemsContainer.classList.remove('active');
        }
    }

    private closeMenu(): void {
        this.isMenuOpen = false;
        this.itemsContainer.classList.remove('active');
    }

    private setPosition(x: number, y: number): void {
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
    }

    private snapToCorner(): void {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Determine quadrants
        const isLeft = centerX < winW / 2;
        const isTop = centerY < winH / 2;

        let targetX, targetY;

        if (isLeft) {
            targetX = this.MARGIN;
        } else {
            targetX = winW - rect.width - this.MARGIN;
        }

        if (isTop) {
            targetY = this.MARGIN;
        } else {
            targetY = winH - rect.height - this.MARGIN;
        }

        // Animate to position
        this.animateTo(targetX, targetY);

        // Update expansion direction
        this.updateExpansionDirection();
    }

    private animateTo(x: number, y: number): void {
        this.container.style.transition = 'left 0.3s ease, top 0.3s ease';
        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;

        // Remove transition after animation to allow drag without lag
        setTimeout(() => {
            this.container.style.transition = '';
        }, 300);
    }

    private updateExpansionDirection(): void {
        const rect = this.container.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        // If in top half, expand DOWN. If in bottom half, expand UP.
        // We won't support left/right expansion for now as vertical stacks look better usually.

        this.container.classList.remove('expand-down', 'expand-up');

        if (centerY < window.innerHeight / 2) {
            this.container.classList.add('expand-down');
        } else {
            this.container.classList.add('expand-up');
        }
    }

    private setupOutsideClickListener(): void {
        // Close menu if clicked outside
        const outsideClick = (e: MouseEvent | TouchEvent) => {
            if (!this.isMenuOpen) {
                document.removeEventListener('click', outsideClick);
                document.removeEventListener('touchstart', outsideClick);
                return;
            }

            const target = e.target as Node;
            if (!this.container.contains(target)) {
                this.closeMenu();
                document.removeEventListener('click', outsideClick);
                document.removeEventListener('touchstart', outsideClick);
            }
        };

        // Small timeout to avoid immediate trigger
        setTimeout(() => {
            document.addEventListener('click', outsideClick);
            document.addEventListener('touchstart', outsideClick, { passive: true });
        }, 0);
    }
}
