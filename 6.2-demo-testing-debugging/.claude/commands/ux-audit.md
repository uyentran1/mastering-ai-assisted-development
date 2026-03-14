Run an automated UX audit on the running application using DevTools MCP.

Prerequisites: Dev server must be running. Chrome DevTools MCP must be configured.

Steps:

1. **Page inventory**: Take a screenshot of each key page (home, task list, task detail, create task form). Log any console errors on each navigation.

2. **Interactive element check**: For each page, identify all buttons, links, and form inputs. Click each one and verify it produces the expected response (navigation, modal, form submission, etc.). Report any that are unresponsive or produce errors.

3. **Responsive layout check**: Resize the viewport to three breakpoints:
   - Desktop (1280px wide)
   - Tablet (768px wide)
   - Mobile (375px wide)
   Take a screenshot at each size. Flag any layout issues: overlapping elements, text overflow, unreachable buttons, horizontal scroll.

4. **Loading and error states**: Navigate with simulated slow network. Verify loading indicators appear. Submit forms with invalid data. Verify error messages are shown clearly and are actionable.

5. **Performance check**: Run a performance trace on the heaviest page. Flag any long tasks (>50ms), layout thrashing, or excessive re-renders.

6. **Report**: Summarize findings as:
   - PASS: [what looks good]
   - WARN: [minor issues worth addressing]
   - FAIL: [issues that need fixing before shipping]

Fix any FAIL issues automatically. For WARN issues, describe the fix but leave it for the developer to decide.
