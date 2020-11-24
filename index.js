#!/usr/bin/env node
const program = require('commander');
const download = require('download-git-repo');
const ora = require('ora');
const chalk = require('chalk');
const symbols = require('log-symbols');
const fs = require('fs');
var inquirer = require('inquirer');
const config = require('./config').config
const path = require('path')

program.version('1.0.0', '-v, --version')
    .command('init <name>')
    .action((name) => {
        if (fs.existsSync(name)) {
            inquirer.prompt([
                {
                    type: 'confirm',
                    message: `${name}目录已存在，是否覆盖此目录？`,
                    name: 'rm'
                }
            ]).then(answers => {
                console.log(answers)
                if (!answers.rm) {
                    console.log(symbols.error, chalk.red('请使用其他目录名称'));
                    return
                }
                rmdirAsync(name).then((err) => {
                    if (err) {
                        console.log(chalk.red(err))
                        return
                    }
                    downloadTmpl(name)
                }).catch(err => {
                    console.log(chalk.red(err))
                    console.log(symbols.error, chalk.red('目录删除失败，请手动删除再重试'));
                })
            })
            return
        }
        downloadTmpl(name)
    });
program.parse(process.argv);

async function rmdirAsync(filePath) {
    let stat = await fs.statSync(filePath)
    if (stat.isFile()) {
        await fs.unlinkSync(filePath)
    } else {
        let dirs = await fs.readdirSync(filePath)
        dirs = dirs.map(dir => rmdirAsync(path.join(filePath, dir)))
        await Promise.all(dirs)
        await fs.rmdirSync(filePath)
    }
}

function downloadTmpl(name) {
    const promptList = [
        {
            type: 'list',
            message: '请选择要下载的模板',
            name: 'tmplName',
            choices: Object.keys(config)
        }
    ]
    inquirer
        .prompt(promptList)
        .then(answers => {
            const spinner = ora('正在下载模板...');
            spinner.start();
            download(config[answers.tmplName], name, { clone: true }, (err) => {
                if (err) {
                    spinner.fail();
                    console.log(symbols.error, chalk.red(err));
                    return
                }

                spinner.succeed();
                console.log(symbols.success, chalk.green('项目初始化完成'));
            })
        })
        .catch(error => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else when wrong
            }
        });
}
