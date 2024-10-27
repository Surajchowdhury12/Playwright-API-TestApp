import { test, expect } from '@playwright/test';
import tags from '../test-data/tags.json'
import { request } from 'http';

test.beforeEach('login to page', async ({ page }) => {
    await page.route('https://conduit-api.bondaracademy.com/api/tags', async route => {

        await route.fulfill({
            body: JSON.stringify(tags)
        })

    });
    await page.goto('https://conduit.bondaracademy.com/');
});

test('get started link', async ({ page }) => {
    test.describe.configure({ retries: 2 })
    await page.route('https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0', async route => {
        const response = await route.fetch()
        const responseBody = await response.json()
        responseBody.articles[0].title = "My playwright title";
        responseBody.articles[0].description = "playwright description";

        await route.fulfill({
            body: JSON.stringify(responseBody)
        })
    })

    await expect(page.locator('[class="logo-font"]')).toHaveText('conduit');
    //await expect(page.locator('.preview-link h1').first()).toContainText('My playwright title');
    await page.waitForTimeout(2000);
});
test('delete article', async ({ page, request }) => {

    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {

            user: { email: "pwtest12@test1.com", password: "test123" }
        }
    })
    const responseBody = await response.json()
    const accessToken = responseBody.user.token

    await request.post('https://conduit-api.bondaracademy.com/api/articles/', {
        data: {
            article: { title: "test article", description: "test description", body: "test msg", tagList: [] }
        },
        headers: {
            Authorization: `Token ${accessToken}`
        }
    })

    await page.getByText('Global Feed').click();
    await page.getByText('test article').click();
    await page.getByRole('button', { name: "Delete Article" }).first().click();
    await page.waitForTimeout(5000);


});

test('create article', async ({ page, request }) => {
    await page.getByText('New Article').click();
    await page.getByPlaceholder('Article Title').fill('playwright test')
    await page.getByPlaceholder("What's this article about?").fill('About playwright')
    await page.getByPlaceholder("Write your article (in markdown)").fill("playwright automation")
    await page.getByRole('button').click()
    await expect(page.locator('app-article-page')).toContainText('playwright test')
    const articleResponse = await page.waitForResponse('https://conduit-api.bondaracademy.com/api/articles/')
    const articleResponseBody = await articleResponse.json()
    const slugID = articleResponseBody.article.slug

    const response = await request.post('https://conduit-api.bondaracademy.com/api/users/login', {
        data: {

            user: { email: "pwtest12@test1.com", password: "test123" }
        }
    })
    const responseBody = await response.json()
    const accessToken = responseBody.user.token

    await request.delete(`https://conduit-api.bondaracademy.com/api/articles/${slugID}`, {
        headers: {
            Authorization: `Token ${accessToken}`
        }
    })



})
