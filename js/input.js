// 통합 입력 컨트롤러 (PC 키보드 & 모바일 가상 패드)

class InputController {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false
    };

    this.touchActive = false;
    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener("keydown", (e) => {
      // 텍스트 인풋 포커스 중일 때는 게임 입력 무시
      if (document.activeElement && document.activeElement.tagName === "INPUT") return;

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          this.keys.left = true;
          break;
        case "ArrowRight":
        case "KeyD":
          this.keys.right = true;
          break;
        case "Space":
        case "ArrowUp":
        case "KeyW":
          if (!this.keys.jump) {
            this.keys.jump = true;
          }
          e.preventDefault();
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          this.keys.left = false;
          break;
        case "ArrowRight":
        case "KeyD":
          this.keys.right = false;
          break;
        case "Space":
        case "ArrowUp":
        case "KeyW":
          this.keys.jump = false;
          break;
      }
    });
  }

  initTouch() {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const mobileControls = document.getElementById("mobile-controls");
    
    if (isTouchDevice && mobileControls) {
      mobileControls.classList.remove("hidden");
    }

    const btnLeft = document.getElementById("btn-touch-left");
    const btnRight = document.getElementById("btn-touch-right");
    const btnJump = document.getElementById("btn-touch-jump");

    const bindTouch = (elem, keyName) => {
      if (!elem) return;
      const start = (e) => {
        e.preventDefault();
        this.keys[keyName] = true;
        elem.classList.add("active");
      };
      const end = (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
        elem.classList.remove("active");
      };

      elem.addEventListener("touchstart", start, { passive: false });
      elem.addEventListener("touchend", end, { passive: false });
      elem.addEventListener("touchcancel", end, { passive: false });
      elem.addEventListener("mousedown", start);
      elem.addEventListener("mouseup", end);
      elem.addEventListener("mouseleave", end);
    };

    bindTouch(btnLeft, "left");
    bindTouch(btnRight, "right");
    bindTouch(btnJump, "jump");
  }

  getState() {
    return { ...this.keys };
  }
}

export const input = new InputController();
