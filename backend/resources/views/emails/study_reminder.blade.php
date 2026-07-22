<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Daily IELTS Reminder</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0F;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">📚</div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Smart IELTS</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Your daily study reminder</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#16161F;border-radius:0 0 16px 16px;padding:32px 36px;">

              <p style="margin:0 0 20px;color:#94A3B8;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#F8FAFC;">{{ $user->name }}</strong> 👋
              </p>

              <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;line-height:1.7;">
                It's time for your daily IELTS practice! Consistency is the key to reaching your target band score.
              </p>

              <!-- Day progress card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1A1A25;border:1px solid #1E293B;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#475569;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Your Progress</p>
                    <p style="margin:0 0 14px;font-size:20px;font-weight:700;color:#F8FAFC;">
                      Day {{ $plan['day_number'] }} <span style="color:#475569;font-size:14px;font-weight:400;">of {{ $plan['total_days'] }}</span>
                    </p>
                    <!-- Progress bar -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1E293B;border-radius:99px;height:6px;overflow:hidden;">
                          <div style="width:{{ min(100, round($plan['day_number'] / $plan['total_days'] * 100)) }}%;height:6px;background:linear-gradient(90deg,#7C3AED,#A855F7);border-radius:99px;"></div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:13px;color:#94A3B8;">
                      Lessons completed:
                      <strong style="color:{{ $plan['on_track'] ? '#10B981' : '#F59E0B' }};">
                        {{ $plan['completed_lessons'] }} / {{ $plan['total_lessons'] }}
                      </strong>
                      @if($plan['on_track'])
                        <span style="color:#10B981;font-size:12px;"> ✓ On track!</span>
                      @else
                        <span style="color:#F59E0B;font-size:12px;"> — Let's catch up today!</span>
                      @endif
                    </p>
                  </td>
                </tr>
              </table>

              @if(!$plan['on_track'])
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#F59E0B;line-height:1.6;">
                      ⚡ You're a bit behind — no worries! Complete {{ $plan['expected_lessons'] - $plan['completed_lessons'] }} more lesson(s) today to get back on track.
                    </p>
                  </td>
                </tr>
              </table>
              @endif

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="https://smartietls.online/dashboard"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:-0.2px;box-shadow:0 0 24px rgba(124,58,237,0.4);">
                      Start Studying Now →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;color:#475569;font-size:12px;text-align:center;line-height:1.6;">
                You're receiving this because you enabled daily reminders on Smart IELTS.<br/>
                <a href="https://smartietls.online/dashboard" style="color:#7C3AED;text-decoration:none;">Manage your preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
