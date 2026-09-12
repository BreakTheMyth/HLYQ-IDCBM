<?php
/**
 * This file is part of webman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author    walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link      http://www.workerman.net/
 * @license   http://www.opensource.org/licenses/mit-license.php MIT License
 */

namespace app\middleware;

use Webman\MiddlewareInterface;
use Webman\Http\Response;
use Webman\Http\Request;

/**
 * 拒绝访问文件名中包含点号前缀的静态资源。
 */
class StaticFile implements MiddlewareInterface
{
    /**
     * 检查静态文件路径并调用后续处理器。
     * @param Request  $request 当前 HTTP 请求
     * @param callable $handler 后续请求处理器
     * @return Response 静态文件响应或拒绝访问响应
     */
    public function process(Request $request, callable $handler): Response
    {
        // Access to files beginning with. Is prohibited
        if (strpos($request->path(), '/.') !== false) {
            return response('<h1>403 forbidden</h1>', 403);
        }
        /**
         * @var Response $response 后续处理器返回的响应
         */
        $response = $handler($request);
        // Add cross domain HTTP header
        /*$response->withHeaders([
            'Access-Control-Allow-Origin'      => '*',
            'Access-Control-Allow-Credentials' => 'true',
        ]);*/
        return $response;
    }
}
