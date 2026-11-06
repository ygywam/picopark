// 플레이어 캐릭터 렌더링 및 모션 관리 (피코파크 스타일)

export class PlayerRenderer {
  static draw(ctx, player, isMe) {
    const { x, y, width = 36, height = 36, color, nickname, isHost, facing = 1, isStackedUnder, isStackedAbove } = player;

    ctx.save();
    ctx.translate(x, y);

    // 1. "내 캐릭터(ME)" 식별 인디케이터
    if (isMe) {
      // 발밑 빛나는 원 (Halo)
      ctx.beginPath();
      ctx.ellipse(width / 2, height + 4, width * 0.7, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
      ctx.fill();

      // 머리 위 노란색 화살표 (▼)
      const bob = Math.sin(Date.now() / 200) * 3;
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.moveTo(width / 2 - 6, -18 + bob);
      ctx.lineTo(width / 2 + 6, -18 + bob);
      ctx.lineTo(width / 2, -10 + bob);
      ctx.closePath();
      ctx.fill();

      // "ME" 텍스트 뱃지
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#ca8a04";
      ctx.textAlign = "center";
      ctx.fillText("ME", width / 2, -22 + bob);
    }

    // 2. 머리 위 닉네임 & 방장 왕관
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#334155";
    ctx.textAlign = "center";
    const displayName = (isHost ? "👑 " : "") + nickname;
    ctx.fillText(displayName, width / 2, -4);

    // 3. 고양이 귀 그리기
    ctx.fillStyle = color;
    ctx.beginPath();
    // 왼쪽 귀
    ctx.moveTo(4, 2);
    ctx.lineTo(8, -8);
    ctx.lineTo(14, 2);
    // 오른쪽 귀
    ctx.moveTo(width - 14, 2);
    ctx.lineTo(width - 8, -8);
    ctx.lineTo(width - 4, 2);
    ctx.fill();

    // 4. 몸통 (둥근 모서리 사각형)
    const radius = 8;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fillStyle = color;
    ctx.fill();

    // 캐릭터 테두리 (입체감)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.stroke();

    // 5. 표정 렌더링
    const eyeOffsetX = facing === 1 ? 4 : -4;

    if (isStackedUnder) {
      // 밑에 깔려서 낑낑대는 표정 (> <)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      // 왼쪽 눈 (>)
      ctx.beginPath();
      ctx.moveTo(width / 2 - 8 + eyeOffsetX, 14);
      ctx.lineTo(width / 2 - 4 + eyeOffsetX, 17);
      ctx.lineTo(width / 2 - 8 + eyeOffsetX, 20);
      ctx.stroke();

      // 오른쪽 눈 (<)
      ctx.beginPath();
      ctx.moveTo(width / 2 + 8 + eyeOffsetX, 14);
      ctx.lineTo(width / 2 + 4 + eyeOffsetX, 17);
      ctx.lineTo(width / 2 + 8 + eyeOffsetX, 20);
      ctx.stroke();

      // 땀방울 연출
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(width + 4, 8, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (isStackedAbove || player.vy < -1) {
      // 머리 위에 올라타거나 점프할 때 활짝 웃는 눈 (^ ^)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.arc(width / 2 - 6 + eyeOffsetX, 18, 4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2 + 6 + eyeOffsetX, 18, 4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

    } else {
      // 평소 눈 (동글동글 깜빡임)
      const isBlinking = (Math.floor(Date.now() / 2500) % 2 === 0) && (Date.now() % 2500 < 150);

      if (isBlinking) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 9 + eyeOffsetX, 16);
        ctx.lineTo(width / 2 - 3 + eyeOffsetX, 16);
        ctx.moveTo(width / 2 + 3 + eyeOffsetX, 16);
        ctx.lineTo(width / 2 + 9 + eyeOffsetX, 16);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(width / 2 - 6 + eyeOffsetX, 15, 3.5, 0, Math.PI * 2);
        ctx.arc(width / 2 + 6 + eyeOffsetX, 15, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자
        ctx.fillStyle = "#0f172a";
        const pupilOffset = facing === 1 ? 1 : -1;
        ctx.beginPath();
        ctx.arc(width / 2 - 6 + eyeOffsetX + pupilOffset, 15, 2, 0, Math.PI * 2);
        ctx.arc(width / 2 + 6 + eyeOffsetX + pupilOffset, 15, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 작은 입
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2 + eyeOffsetX, 24, 2.5, 0, Math.PI);
    ctx.stroke();

    ctx.restore();
  }
}
