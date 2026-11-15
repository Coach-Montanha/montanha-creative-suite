import asyncio
import os
from playwright.async_api import async_playwright

async def verify_real():
    base_dir = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Creative Suite"
    html_path = os.path.join(base_dir, "index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        await page.goto(file_url)
        await page.wait_for_timeout(800)

        # Go to AI tab
        await page.click('button[data-view="ai"]')
        await page.wait_for_timeout(1000)

        shot = os.path.join(base_dir, "screenshots", "comprovacao_foto_real_flux.png")
        await page.screenshot(path=shot)
        print(f"Captured real photo verification to: {shot}")

        await browser.close()
        print("Verification complete!")

if __name__ == "__main__":
    asyncio.run(verify_real())
